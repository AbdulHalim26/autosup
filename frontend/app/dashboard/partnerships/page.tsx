"use client";

import { useMemo } from "react";
import { Handshake, FileClock, Percent, ShieldCheck, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { SuppliersTrustPanel } from "@/components/suppliers/suppliers-trust-panel";
import { Badge } from "@/components/ui/badge";
import { usePartnershipsSummary } from "@/hooks/usePartnerships";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuthStore } from "@/store/useAuthStore";

export default function PartnershipsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data: summaryData } = usePartnershipsSummary();
  const { data: suppliersData, isLoading: isSuppliersLoading } = useSuppliers({ type: "partner" });

  const summary = summaryData?.summary;
  const partners = suppliersData?.suppliers ?? [];

  // Adapt PartnershipInsight to AiInsight format for the InsightCard component
  const adaptedInsights = useMemo(() => {
    const insights = summaryData?.insights ?? [];
    return insights.map((i) => ({
      type: i.type,
      message: i.message,
      urgency: i.urgency,
      item_id: i.supplier_id ?? i.type,
    }));
  }, [summaryData?.insights]);

  if (role !== "distributor") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Halaman ini khusus untuk Distributor.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Partnership Hub</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Partnerships & Trust</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Kelola lifecycle kemitraan strategis, verifikasi trust layer secara on-chain, dan pantau metrik ekosistem partner secara komprehensif.
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Active Partnerships"
            value={String(summary.active_partnerships)}
            meta="Supplier partner aktif"
            tone="success"
            icon={Handshake}
          />
          <KpiCard
            label="Pending Agreements"
            value={String(summary.pending_agreements)}
            meta="Menunggu persetujuan"
            tone="warning"
            icon={FileClock}
          />
          <KpiCard
            label="Renewal Rate"
            value={`${summary.contract_renewal_rate}%`}
            meta="Retensi kontrak"
            tone="info"
            icon={Percent}
          />
          <KpiCard
            label="Trust Score"
            value={String(summary.trust_score)}
            meta="Rata-rata kredibilitas"
            tone="success"
            icon={ShieldCheck}
          />
          <KpiCard
            label="Network Growth"
            value={`+${summary.network_growth}%`}
            meta="Dalam 30 hari terakhir"
            tone="info"
            icon={TrendingUp}
          />
        </section>
      )}

      {/* AI Insights */}
      {adaptedInsights.length > 0 && (
        <section>
          <InsightCard insights={adaptedInsights} />
        </section>
      )}

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Active Agreements</h2>
          
          {isSuppliersLoading && (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <span className="text-sm text-[#64748B]">Memuat data partner...</span>
            </div>
          )}

          {!isSuppliersLoading && partners.length === 0 && (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <span className="text-sm font-medium text-[#0F172A]">Belum ada active partnership</span>
              <span className="mt-1 text-xs text-[#64748B]">Cari supplier di halaman Suppliers.</span>
            </div>
          )}

          {!isSuppliersLoading && partners.length > 0 && (
            <div className="grid gap-4">
              {partners.map((supplier) => (
                <SupplierCard key={supplier.supplier_id} supplier={supplier} />
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <SuppliersTrustPanel />
        </div>
      </section>
    </main>
  );
}
