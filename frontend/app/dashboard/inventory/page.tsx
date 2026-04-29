"use client";

import { useCallback, useState } from "react";
import { ArchiveX, Boxes, CircleAlert, Download, Plus } from "lucide-react";
import { InventoryEmptyState } from "@/components/inventory/inventory-empty-state";
import { InventoryErrorState } from "@/components/inventory/inventory-error-state";
import { InventoryFilterBar } from "@/components/inventory/inventory-filter-bar";
import { InventoryLoadingState } from "@/components/inventory/inventory-loading-state";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { ItemFormDialog } from "@/components/inventory/item-form-dialog";
import { DeleteConfirmDialog } from "@/components/inventory/delete-confirm-dialog";
import { RestockPanel } from "@/components/inventory/restock-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useInventory,
  useRestockRecommendation,
  type InventoryItem,
  type RestockRecommendation,
} from "@/hooks/useInventory";

type DialogState =
  | { type: "closed" }
  | { type: "add" }
  | { type: "edit"; item: InventoryItem }
  | { type: "delete"; item: InventoryItem };

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });
  const [restock, setRestock] = useState<RestockRecommendation | null>(null);

  const { data, isLoading, isError, refetch } = useInventory({ search, category, status });
  const restockMutation = useRestockRecommendation();

  const openAdd = useCallback(() => setDialog({ type: "add" }), []);
  const openEdit = useCallback((item: InventoryItem) => setDialog({ type: "edit", item }), []);
  const openDelete = useCallback((item: InventoryItem) => setDialog({ type: "delete", item }), []);
  const closeDialog = useCallback(() => setDialog({ type: "closed" }), []);

  async function handleRestock(item: InventoryItem) {
    setRestock(null);
    try {
      const rec = await restockMutation.mutateAsync(item.id);
      setRestock(rec);
    } catch {
      /* silently fail — user can retry */
    }
  }

  function handleCreateOrder(rec: RestockRecommendation) {
    // TODO: pre-fill order form with supplier_id and item_id when orders page is ready
    console.log("Create order for", rec.item_name, "from", rec.suggested_supplier?.name);
    setRestock(null);
  }

  const summary = data?.summary ?? { total_items: 0, low_stock_count: 0, out_of_stock_count: 0 };
  const items = data?.items ?? [];

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Inventory management</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Inventory</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Pantau stok, threshold minimum, dan readiness operasional dari satu halaman kerja yang terhubung langsung ke data real.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total Items"
          value={String(summary.total_items)}
          meta="All tracked SKUs"
          tone="info"
          icon={Boxes}
        />
        <KpiCard
          label="Low Stock"
          value={String(summary.low_stock_count)}
          meta="Needs attention soon"
          tone="warning"
          icon={CircleAlert}
        />
        <KpiCard
          label="Out of Stock"
          value={String(summary.out_of_stock_count)}
          meta="Immediate action needed"
          tone="danger"
          icon={ArchiveX}
        />
      </section>

      {/* AI Restock panel (shown after recommendation is fetched) */}
      {restock && (
        <RestockPanel
          recommendation={restock}
          onClose={() => setRestock(null)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* Loading restock */}
      {restockMutation.isPending && (
        <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF] px-5 py-4 text-sm text-[#2563EB]">
          Mengambil rekomendasi restock dari AI...
        </div>
      )}

      {/* Filter bar */}
      <InventoryFilterBar
        search={search}
        category={category}
        status={status}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onReset={() => { setSearch(""); setCategory(""); setStatus(""); }}
      />

      {/* Main content states */}
      {isLoading && <InventoryLoadingState />}

      {isError && !isLoading && (
        <InventoryErrorState onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && items.length === 0 && (
        <InventoryEmptyState onAdd={openAdd} />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <InventoryTable
          items={items}
          onEdit={openEdit}
          onDelete={openDelete}
          onRestock={handleRestock}
        />
      )}

      {/* Dialogs */}
      <ItemFormDialog
        open={dialog.type === "add" || dialog.type === "edit"}
        onClose={closeDialog}
        editItem={dialog.type === "edit" ? dialog.item : null}
      />

      <DeleteConfirmDialog
        open={dialog.type === "delete"}
        onClose={closeDialog}
        item={dialog.type === "delete" ? dialog.item : null}
      />
    </main>
  );
}
