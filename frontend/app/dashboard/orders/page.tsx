"use client";

import { useState } from "react";
import { CheckCheck, Clock3, PackageOpen, Plus, Truck } from "lucide-react";
import { useOrders, useUpdateOrderStatus, type OrderStatus } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/useAuthStore";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OrderCard } from "@/components/orders/order-card";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import { OrdersEmptyState } from "@/components/orders/orders-empty-state";
import { OrdersErrorState } from "@/components/orders/orders-error-state";
import { OrdersFilterBar } from "@/components/orders/orders-filter-bar";
import { OrdersLoadingState } from "@/components/orders/orders-loading-state";
import { OrdersTrustPanel } from "@/components/orders/orders-trust-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isBuyer = role === "distributor" || role === "retailer";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useOrders({
    role: isBuyer ? "buyer" : "seller",
    status: statusFilter || undefined,
  });

  const { mutate: updateStatus, isPending: isUpdating, variables: updatingVars } =
    useUpdateOrderStatus();

  const orders = data?.orders ?? [];
  const summary = data?.summary;

  // client-side search filter (order_number atau nama partner)
  const filtered = search.trim()
    ? orders.filter((o) => {
        const q = search.toLowerCase();
        return (
          o.order_number.toLowerCase().includes(q) ||
          o.buyer.name.toLowerCase().includes(q) ||
          o.seller.name.toLowerCase().includes(q)
        );
      })
    : orders;

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Order operations</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">
              Orders
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              {isBuyer
                ? "Pantau semua order ke vendor partner dan buat order baru langsung dari sini."
                : "Kelola incoming order dari partner dan perbarui status fulfillment."}
            </p>
          </div>
        </div>

        {isBuyer && (
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </div>
        )}
      </section>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Orders"
          value={summary ? String(summary.active_orders) : "—"}
          meta="Currently in motion"
          tone="info"
          icon={PackageOpen}
        />
        <KpiCard
          label="Pending Orders"
          value={summary ? String(summary.pending_orders) : "—"}
          meta="Waiting supplier response"
          tone="warning"
          icon={Clock3}
        />
        <KpiCard
          label="Shipping Orders"
          value={summary ? String(summary.shipping_orders) : "—"}
          meta="In transit now"
          tone="info"
          icon={Truck}
        />
        <KpiCard
          label="Delivered This Month"
          value={summary ? String(summary.delivered_this_month) : "—"}
          meta="Completed successfully"
          tone="success"
          icon={CheckCheck}
        />
      </section>

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <OrdersFilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* ── Main Content ───────────────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="grid gap-4">
          {isLoading && <OrdersLoadingState />}

          {isError && !isLoading && (
            <OrdersErrorState onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <OrdersEmptyState />
          )}

          {!isLoading &&
            !isError &&
            filtered.map((order) => (
              <OrderCard
                key={order.order_id}
                order={{
                  ...order,
                  estimated_delivery: formatDate(order.estimated_delivery),
                  updated_at: formatDate(order.updated_at),
                  created_at: formatDate(order.created_at),
                }}
                userRole={role}
                isUpdating={
                  isUpdating && updatingVars?.orderId === order.order_id
                }
                onUpdateStatus={(orderId, status) =>
                  updateStatus({ orderId, status })
                }
              />
            ))}
        </div>

        {/* Trust panel — selalu tampil di sidebar */}
        <div className="space-y-6">
          <OrdersTrustPanel />
        </div>
      </section>

      <OrderFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </main>
  );
}
