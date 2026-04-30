"use client";

import { 
  Map, 
  MapPin, 
  Package, 
  TrendingUp, 
  Loader2 
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageErrorState } from "@/components/dashboard/page-error-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGeoDemand } from "@/hooks/useGeoDemand";
import { useAuthStore } from "@/store/useAuthStore";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function GeoMappingPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, isError, refetch } = useGeoDemand();

  if (role !== "supplier") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Halaman Geo Mapping khusus untuk Supplier.</p>
        </div>
      </main>
    );
  }

  const regions = data?.regions ?? [];

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Regional Analytics</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Geo Mapping Demand</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Lihat distribusi pesanan dan tren pendapatan berdasarkan wilayah geografis untuk mengoptimalkan rute logistik dan penetrasi pasar.
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      {data && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <KpiCard
            label="Total Regions Served"
            value={String(data.total_regions_served)}
            meta="Wilayah jangkauan distribusi aktif"
            tone="info"
            icon={Map}
          />
          <KpiCard
            label="Top Growth Region"
            value={data.top_growth_region}
            meta="Wilayah dengan pertumbuhan pesat"
            tone="success"
            icon={TrendingUp}
          />
        </section>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <section>
          <PageErrorState message="Gagal memuat data geo mapping" onRetry={() => refetch()} />
        </section>
      )}

      {/* Main content */}
      {!isError && (
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Regional Performance Ranking</h2>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : regions.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center">
                  <span className="text-sm text-[#64748B]">Belum ada data regional.</span>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 border-b border-[#E2E8F0] pb-3 text-xs uppercase tracking-wider text-[#64748B]">
                    <div className="col-span-4">Region</div>
                    <div className="col-span-3 text-right">Orders</div>
                    <div className="col-span-3 text-right">Revenue</div>
                    <div className="col-span-2 text-right">Growth</div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-[#E2E8F0]">
                    {regions.map((r, i) => (
                      <div key={i} className="grid grid-cols-12 items-center gap-4 py-4 transition-colors hover:bg-slate-50/50">
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#3B82F6]">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">{r.region}</p>
                            <p className="text-[10px] text-[#64748B]">Top: {r.top_category}</p>
                          </div>
                        </div>
                        <div className="col-span-3 text-right font-medium text-[#0F172A]">
                          {formatNumber(r.order_volume)}
                        </div>
                        <div className="col-span-3 text-right font-medium text-[#0F172A]">
                          {formatCurrency(r.revenue)}
                        </div>
                        <div className="col-span-2 text-right">
                          <Badge tone={r.growth_pct >= 0 ? "success" : "danger"} className="ml-auto w-fit">
                            {r.growth_pct >= 0 ? "+" : ""}{r.growth_pct}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Heatmap Visualization</h2>
          
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Distribution Map</CardTitle>
                <Badge tone="info" className="gap-1">
                  <Package className="h-3 w-3" /> Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex h-[320px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : (
                <div className="relative h-[320px] w-full bg-[#E2E8F0] flex items-center justify-center">
                  {/* Mock Map Background Placeholder */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                  <Map className="h-24 w-24 text-slate-400 opacity-30" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="rounded-xl bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#0F172A] mb-2">Demand Density</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#64748B]">Low</span>
                        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-600" />
                        <span className="text-[10px] text-[#64748B]">High</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      )}
    </main>
  );
}
