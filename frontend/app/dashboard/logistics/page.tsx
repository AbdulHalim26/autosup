"use client";

import { 
  AlertCircle, 
  MapPin, 
  Package, 
  PackageCheck, 
  Truck, 
  Loader2 
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogistics } from "@/hooks/useLogistics";
import { useAuthStore } from "@/store/useAuthStore";

const statusTone = {
  processing: "neutral",
  in_transit: "info",
  delivered: "success",
  delayed: "danger",
} as const;

const statusLabel = {
  processing: "Processing",
  in_transit: "In Transit",
  delivered: "Delivered",
  delayed: "Delayed",
} as const;

export default function LogisticsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useLogistics();

  if (role !== "distributor") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Halaman Logistics khusus untuk Distributor.</p>
        </div>
      </main>
    );
  }

  const shipments = data?.shipments ?? [];
  const partners = data?.partners ?? [];

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Fulfillment Control</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Logistics</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Pantau pengiriman aktif, cek rute operasional, dan kelola logistics partner untuk efisiensi distribusi.
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      {data && (
        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Active Shipments"
            value={String(data.active_shipments)}
            meta="Dalam pengiriman saat ini"
            tone="info"
            icon={Truck}
          />
          <KpiCard
            label="Delivered Today"
            value={String(data.delivered_today)}
            meta="Pesanan selesai hari ini"
            tone="success"
            icon={PackageCheck}
          />
          <KpiCard
            label="Delayed Shipments"
            value={String(data.delayed_shipments)}
            meta="Perlu perhatian"
            tone="danger"
            icon={AlertCircle}
          />
        </section>
      )}

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Live Shipments</h2>
          
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <span className="text-sm font-medium text-[#0F172A]">Belum ada pengiriman aktif</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {shipments.map((shipment) => (
                <Card key={shipment.id} className="rounded-2xl">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-[#64748B]">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A]">{shipment.retailer_name}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {shipment.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" /> {shipment.carrier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge tone={statusTone[shipment.status]}>{statusLabel[shipment.status]}</Badge>
                      <p className="text-xs text-[#64748B]">
                        ETA: {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(shipment.eta))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Logistics Partners</CardTitle>
              <p className="text-sm text-[#64748B]">Performa penyedia layanan kurir</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : partners.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center">Belum ada partner terdaftar.</p>
              ) : (
                <div className="space-y-4">
                  {partners.map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{partner.name}</p>
                        <p className="mt-0.5 text-xs text-[#64748B]">{partner.active_shipments} pengiriman aktif</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-[#64748B]">Reliability</p>
                        <p className="font-semibold text-[#22C55E]">{partner.reliability_score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
