"use client";

import { 
  ArrowUpRight, 
  BarChart3, 
  Boxes, 
  LineChart, 
  Loader2, 
  Target, 
  Truck 
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRetailerAnalytics } from "@/hooks/useAnalytics";
import { useAuthStore } from "@/store/useAuthStore";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}

export default function AnalyticsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useRetailerAnalytics();

  if (!role) {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Silakan login terlebih dahulu.</p>
        </div>
      </main>
    );
  }

  const summary = data?.summary;
  const trends = data?.trends ?? [];
  const topProducts = data?.top_products ?? [];

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Business intelligence</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Analytics</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Pantau performa bisnis, kesehatan inventory, kecepatan pengiriman vendor, dan pertumbuhan pendapatan dari waktu ke waktu.
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Revenue Growth"
            value={`+${summary.revenue_growth}%`}
            meta="Dibanding bulan lalu"
            tone="success"
            icon={LineChart}
          />
          <KpiCard
            label="Inventory Turnover"
            value={`${summary.inventory_turnover}x`}
            meta="Rata-rata perputaran stok"
            tone="info"
            icon={Boxes}
          />
          <KpiCard
            label="Fulfillment Rate"
            value={`${summary.order_fulfillment_rate}%`}
            meta="Pesanan terkirim penuh"
            tone="success"
            icon={Target}
          />
          <KpiCard
            label="Supplier Perf."
            value={`${summary.supplier_performance}/100`}
            meta="Indeks kinerja vendor"
            tone="success"
            icon={BarChart3}
          />
          <KpiCard
            label="Forecast Accuracy"
            value={`${summary.forecast_accuracy}%`}
            meta="Akurasi prediksi demand"
            tone="warning"
            icon={Target}
          />
        </section>
      )}

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1fr_0.4fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Financial Trends</h2>
          
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Revenue vs Spending (6 Bulan Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : (
                <div className="relative h-64 w-full">
                  {/* Simplified bar chart representation using pure HTML/CSS */}
                  <div className="absolute inset-0 flex items-end justify-between px-2 pb-6 pt-4">
                    {/* Y-axis rough grid lines */}
                    <div className="absolute inset-x-0 bottom-6 top-4 flex flex-col justify-between border-l border-[#E2E8F0]">
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-[#E2E8F0]" />
                    </div>

                    {trends.map((t, i) => {
                      // Max value roughly 30jt for scaling
                      const maxVal = 30000000;
                      const revPct = Math.max(5, (t.revenue / maxVal) * 100);
                      const spendPct = Math.max(5, (t.spending / maxVal) * 100);

                      return (
                        <div key={i} className="relative z-10 flex h-full flex-col justify-end">
                          <div className="flex w-16 items-end justify-center gap-1">
                            <div 
                              className="w-4 rounded-t-sm bg-[#3B82F6] transition-all hover:opacity-80" 
                              style={{ height: `${revPct}%` }}
                              title={`Revenue: ${formatCurrency(t.revenue)}`}
                            />
                            <div 
                              className="w-4 rounded-t-sm bg-[#F59E0B] transition-all hover:opacity-80" 
                              style={{ height: `${spendPct}%` }}
                              title={`Spending: ${formatCurrency(t.spending)}`}
                            />
                          </div>
                          <p className="mt-2 text-center text-xs text-[#64748B]">{t.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="absolute -top-2 right-0 flex gap-4 text-xs font-medium text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#3B82F6]" /> Revenue
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#F59E0B]" /> Spending
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#3B82F6]" />
                <CardTitle className="text-base">Top Demand Items</CardTitle>
              </div>
              <p className="text-sm text-[#64748B]">Fast-moving products</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : topProducts.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center">Belum ada data.</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-[#64748B]">
                          {i + 1}
                        </span>
                        <p className="text-sm font-medium text-[#0F172A]">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-[#22C55E]">
                        {p.sales} <ArrowUpRight className="h-3 w-3" />
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
