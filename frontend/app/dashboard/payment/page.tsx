"use client";


import { 
  Banknote, 
  CheckCircle2, 
  Clock3, 
  CreditCard, 
  Loader2, 
  PieChart, 
  Wallet 
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRetailerPayments, usePayInvoice } from "@/hooks/usePayment";
import { useAuthStore } from "@/store/useAuthStore";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusTone = { pending: "warning", paid: "success", overdue: "danger" } as const;
const statusLabel = { pending: "Belum Dibayar", paid: "Lunas", overdue: "Jatuh Tempo" } as const;

export default function PaymentPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useRetailerPayments();
  const payMutation = usePayInvoice();

  if (role !== "retailer" && role !== "distributor") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Halaman Payment ini dikhususkan untuk Retailer atau Distributor.</p>
        </div>
      </main>
    );
  }

  const summary = data?.summary;
  const invoices = data?.invoices ?? [];
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
          <Badge tone="info">Financial control</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Payments & Credit</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Lacak invoice keluar ke vendor, manfaatkan fasilitas credit line, dan optimalkan pengeluaran dengan AI cash flow recommendation.
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Total Outstanding"
            value={formatCurrency(summary.total_outstanding)}
            meta="Hutang berjalan"
            tone="warning"
            icon={Banknote}
          />
          <KpiCard
            label="Paid This Month"
            value={formatCurrency(summary.paid_this_month)}
            meta="Sudah dibayar bulan ini"
            tone="success"
            icon={CheckCircle2}
          />
          <KpiCard
            label="Available Credit"
            value={formatCurrency(summary.available_credit)}
            meta="Kredit limit tersisa"
            tone="info"
            icon={CreditCard}
          />
          <KpiCard
            label="Upcoming Due"
            value={String(summary.upcoming_due_payments)}
            meta="Tagihan segera jatuh tempo"
            tone="danger"
            icon={Clock3}
          />
          <KpiCard
            label="Payment Success"
            value={`${summary.payment_success_rate}%`}
            meta="Tingkat keberhasilan"
            tone="success"
            icon={PieChart}
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
          <h2 className="text-lg font-semibold text-[#0F172A]">Vendor Invoices</h2>
          
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <span className="text-sm font-medium text-[#0F172A]">Tidak ada tagihan aktif</span>
              <span className="mt-1 text-xs text-[#64748B]">Semua tagihan vendor sudah lunas.</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {invoices.map((inv) => (
                <Card key={inv.invoice_id} className="rounded-2xl">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-[#0F172A]">{inv.vendor_name}</p>
                        <Badge tone={statusTone[inv.status]}>{statusLabel[inv.status]}</Badge>
                      </div>
                      <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(inv.amount)}</p>
                      <div className="flex gap-4 text-xs text-[#64748B]">
                        <span>Order ID: {inv.order_id}</span>
                        <span>
                          Jatuh tempo: {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(inv.due_date))}
                        </span>
                      </div>
                    </div>
                    <div>
                      {inv.status !== "paid" ? (
                        <Button 
                          onClick={() => payMutation.mutate(inv.invoice_id)}
                          disabled={payMutation.isPending}
                        >
                          {payMutation.isPending && payMutation.variables === inv.invoice_id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Bayar Sekarang
                        </Button>
                      ) : (
                        <Button variant="secondary" disabled>
                          Sudah Lunas
                        </Button>
                      )}
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
              <CardTitle className="text-base">Credit & Financing Panel</CardTitle>
              <p className="text-sm text-[#64748B]">Fasilitas kredit dari distributor partner</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {summary && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#0F172A]">Credit Utilization</span>
                      <span className="font-medium text-[#3B82F6]">{summary.credit_utilization_pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div 
                        className="h-full bg-[#3B82F6] transition-all" 
                        style={{ width: `${summary.credit_utilization_pct}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-[#E2E8F0] p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-[#64748B]">Kredit Tersedia</p>
                    <p className="mt-1 text-2xl font-semibold text-[#0F172A]">{formatCurrency(summary.available_credit)}</p>
                  </div>
                </>
              )}

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <Wallet className="mt-0.5 h-5 w-5 text-[#64748B]" />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">Metode Pembayaran</p>
                    <p className="mt-1 text-sm text-[#64748B]">Bank Transfer, E-Wallet, dan Escrow dihubungkan dan diamankan oleh backend.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
