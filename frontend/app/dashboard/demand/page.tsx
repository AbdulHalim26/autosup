"use client";

import { useState } from "react";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Loader2, 
  TrendingDown, 
  TrendingUp 
} from "lucide-react";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemandIntelligence } from "@/hooks/useDemand";
import { useAuthStore } from "@/store/useAuthStore";

function formatNumber(num: number) {
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function DemandPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const { data, isLoading } = useDemandIntelligence(period);

  if (role !== "supplier") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Halaman Demand Intelligence khusus untuk Supplier.</p>
        </div>
      </main>
    );
  }

  const trends = data?.trends ?? [];
  const rising = data?.top_rising ?? [];
  const declining = data?.declining ?? [];
  const insights = data?.insights ?? [];

  const adaptedInsights = insights.map((i) => ({
    type: i.type,
    message: i.message,
    urgency: i.urgency,
    item_id: i.type,
  }));

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Data & Intelligence</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Demand Intelligence</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Analisis tren permintaan produk secara keseluruhan untuk membantu perencanaan produksi dan inventory yang lebih efisien.
            </p>
          </div>
        </div>
        <div className="flex rounded-lg border border-[#E2E8F0] bg-slate-50 p-1">
          <button
            onClick={() => setPeriod("weekly")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              period === "weekly" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              period === "monthly" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Monthly
          </button>
        </div>
      </section>

      {/* AI Insights */}
      {adaptedInsights.length > 0 && (
        <section>
          <InsightCard insights={adaptedInsights} />
        </section>
      )}

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Overall Demand Trend</h2>
          
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : (
                <div className="relative h-[300px] w-full">
                  <div className="absolute inset-0 flex items-end justify-between px-2 pb-6 pt-4">
                    {/* Y-axis rough grid lines */}
                    <div className="absolute inset-x-0 bottom-6 top-4 flex flex-col justify-between border-l border-[#E2E8F0]">
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-dashed border-[#E2E8F0] opacity-50" />
                      <div className="w-full border-b border-[#E2E8F0]" />
                    </div>

                    {trends.map((t, i) => {
                      const maxVal = period === "monthly" ? 25000 : 8000;
                      const hPct = Math.max(10, (t.total_volume / maxVal) * 100);

                      return (
                        <div key={i} className="relative z-10 flex h-full flex-col justify-end">
                          <div className="flex w-12 items-end justify-center gap-1 sm:w-16">
                            <div 
                              className="w-full rounded-t-md bg-[#3B82F6] transition-all hover:bg-[#2563EB]" 
                              style={{ height: `${hPct}%` }}
                              title={`Volume: ${formatNumber(t.total_volume)}`}
                            />
                          </div>
                          <p className="mt-2 text-center text-xs font-medium text-[#64748B]">{t.period}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Product Performance</h2>
          
          <Card className="rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#22C55E]" />
                <CardTitle className="text-base">Top Rising Demand</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : rising.length === 0 ? (
                <p className="text-sm text-[#64748B]">Tidak ada data.</p>
              ) : (
                <div className="space-y-4">
                  {rising.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{p.name}</p>
                        <p className="mt-0.5 text-xs text-[#64748B]">{formatNumber(p.current_demand)} orders/period</p>
                      </div>
                      <Badge tone="success" className="gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {p.growth_pct}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                <CardTitle className="text-base">Declining Demand</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : declining.length === 0 ? (
                <p className="text-sm text-[#64748B]">Tidak ada data.</p>
              ) : (
                <div className="space-y-4">
                  {declining.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{p.name}</p>
                        <p className="mt-0.5 text-xs text-[#64748B]">{formatNumber(p.current_demand)} orders/period</p>
                      </div>
                      <Badge tone="danger" className="gap-1">
                        <ArrowDownRight className="h-3 w-3" />
                        {Math.abs(p.growth_pct)}%
                      </Badge>
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
