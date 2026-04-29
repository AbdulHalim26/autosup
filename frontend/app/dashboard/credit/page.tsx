"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Bot,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreditAccounts,
  useCreditRepayments,
  useAiCreditRisk,
  useOpenCreditAccount,
  useUpdateCreditAccount,
  type CreditAccountStatus,
  type CreditRiskResult,
  type RiskLevel,
} from "@/hooks/useCredit";
import { mockRetailers } from "@/hooks/useRetailers";
import { useAuthStore } from "@/store/useAuthStore";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const statusTone: Record<CreditAccountStatus, "success" | "danger" | "warning" | "neutral"> = {
  active: "success",
  overdue: "danger",
  suspended: "warning",
  closed: "neutral",
};

const statusLabel: Record<CreditAccountStatus, string> = {
  active: "Aktif",
  overdue: "Jatuh Tempo",
  suspended: "Ditangguhkan",
  closed: "Ditutup",
};

const riskTone: Record<RiskLevel, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

function UtilizationBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "bg-[#EF4444]" : pct >= 60 ? "bg-[#F59E0B]" : "bg-[#22C55E]";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function OpenCreditDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const openCredit = useOpenCreditAccount();
  const aiRisk = useAiCreditRisk();
  const [form, setForm] = useState({
    retailer_id: "",
    credit_limit: "",
    billing_cycle_days: "30",
    notes: "",
  });
  const [riskResult, setRiskResult] = useState<CreditRiskResult | undefined>(undefined);

  function handleCheckRisk() {
    if (!form.retailer_id) return;
    aiRisk.mutate(form.retailer_id, {
      onSuccess: (result) => setRiskResult(result),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    openCredit.mutate(
      {
        retailer_id: form.retailer_id,
        credit_limit: Number(form.credit_limit),
        billing_cycle_days: Number(form.billing_cycle_days),
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setForm({ retailer_id: "", credit_limit: "", billing_cycle_days: "30", notes: "" });
          setRiskResult(undefined);
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buka Credit Line</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Retailer</Label>
            <Select
              value={form.retailer_id}
              onValueChange={(v) => {
                setForm((f) => ({ ...f, retailer_id: v }));
                setRiskResult(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih retailer..." />
              </SelectTrigger>
              <SelectContent>
                {mockRetailers.map((r) => (
                  <SelectItem key={r.retailer_id} value={r.retailer_id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Risk Check */}
          {form.retailer_id && (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-sm font-medium text-[#0F172A]">AI Credit Risk</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCheckRisk}
                  disabled={aiRisk.isPending}
                >
                  {aiRisk.isPending ? (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : null}
                  Analisis
                </Button>
              </div>

              {riskResult && (
                <div className="space-y-2 border-t border-[#E2E8F0] pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Risk Score</span>
                    <span className="font-semibold text-[#0F172A]">{riskResult.risk_score}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Risk Level</span>
                    <Badge tone={riskTone[riskResult.risk_level]}>{riskResult.risk_level}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Max Suggestion</span>
                    <span className="font-medium text-[#0F172A]">
                      {formatCurrency(riskResult.max_credit_suggestion)}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {riskResult.recommendation}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Limit Kredit (IDR)</Label>
            <Input
              required
              type="number"
              min={100000}
              value={form.credit_limit}
              onChange={(e) => setForm((f) => ({ ...f, credit_limit: e.target.value }))}
              placeholder="5000000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Siklus Tagihan (hari)</Label>
            <Select
              value={form.billing_cycle_days}
              onValueChange={(v) => setForm((f) => ({ ...f, billing_cycle_days: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14 hari</SelectItem>
                <SelectItem value="30">30 hari</SelectItem>
                <SelectItem value="45">45 hari</SelectItem>
                <SelectItem value="60">60 hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Informasi tambahan..."
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle className="mb-1 h-3.5 w-3.5 inline mr-1" />
            Membuka credit line akan membebankan tanggung jawab pembayaran. Pastikan Anda
            telah meninjau analisis risiko sebelum konfirmasi.
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={openCredit.isPending || !form.retailer_id || !form.credit_limit}
            >
              {openCredit.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Buka Credit Line
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RepaymentPanel({
  creditAccountId,
  retailerName,
  onClose,
}: {
  creditAccountId: string;
  retailerName: string;
  onClose: () => void;
}) {
  const { data: repayments, isLoading } = useCreditRepayments(creditAccountId);

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[#E2E8F0] bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
        <div>
          <h3 className="font-semibold text-[#0F172A]">Riwayat Repayment</h3>
          <p className="text-xs text-[#64748B]">{retailerName}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
          </div>
        ) : !repayments || repayments.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-[#64748B]">Belum ada riwayat repayment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repayments.map((r) => (
              <div
                key={r.repayment_id}
                className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                    <p className="text-sm font-medium text-[#0F172A]">
                      {formatCurrency(r.amount)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {formatDate(r.paid_at)} · {r.payment_method.replace("_", " ")}
                  </p>
                </div>
                <Badge tone={r.status === "paid" ? "success" : "danger"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreditPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [filterStatus, setFilterStatus] = useState<CreditAccountStatus | "">("");
  const [showOpen, setShowOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data, isLoading } = useCreditAccounts({
    status: filterStatus || undefined,
  });

  const updateAccount = useUpdateCreditAccount();

  if (role !== "distributor") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            Halaman Credit Line khusus untuk Distributor.
          </p>
        </div>
      </main>
    );
  }

  const accounts = data?.accounts ?? [];
  const summary = data?.summary;
  const selectedAccount = accounts.find((a) => a.credit_account_id === selectedAccountId);

  function handleSuspend(creditAccountId: string) {
    updateAccount.mutate({ creditAccountId, body: { status: "suspended" } });
  }

  return (
    <>
      <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge tone="info">Financing</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">
                Credit Line
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
                Kelola fasilitas kredit yang Anda berikan kepada retailer. Pantau utilisasi,
                repayment, dan risiko kredit secara real-time.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowOpen(true)} className="gap-2 self-start lg:self-auto">
            <Plus className="h-4 w-4" />
            Buka Credit Line
          </Button>
        </section>

        {/* KPI */}
        {summary && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Issued"
              value={formatCurrency(summary.total_issued)}
              meta="Total limit kredit diterbitkan"
              tone="info"
              icon={CreditCard}
            />
            <KpiCard
              label="Outstanding"
              value={formatCurrency(summary.outstanding_balance)}
              meta="Total saldo terutang"
              tone="warning"
              icon={BadgeDollarSign}
            />
            <KpiCard
              label="Overdue"
              value={String(summary.overdue_count)}
              meta="Akun melewati jatuh tempo"
              tone="danger"
              icon={AlertTriangle}
            />
            <KpiCard
              label="Repayment Rate"
              value={`${Math.round(summary.repayment_success_rate * 100)}%`}
              meta="Tingkat keberhasilan pembayaran"
              tone="success"
              icon={TrendingUp}
            />
          </section>
        )}

        {/* Filter */}
        <section className="flex items-center gap-3">
          <Select
            value={filterStatus || "all"}
            onValueChange={(v) =>
              setFilterStatus(v === "all" ? "" : (v as CreditAccountStatus))
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="overdue">Jatuh Tempo</SelectItem>
              <SelectItem value="suspended">Ditangguhkan</SelectItem>
              <SelectItem value="closed">Ditutup</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Accounts list */}
        <section className="space-y-3">
          {isLoading ? (
            <Card className="rounded-2xl">
              <CardContent className="flex h-[300px] items-center justify-center pt-6">
                <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
              </CardContent>
            </Card>
          ) : accounts.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex h-[300px] flex-col items-center justify-center gap-3 pt-6">
                <CreditCard className="h-10 w-10 text-[#CBD5E1]" />
                <p className="text-sm text-[#64748B]">Belum ada credit line yang dibuka.</p>
                <Button variant="outline" size="sm" onClick={() => setShowOpen(true)}>
                  Buka Credit Line Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.credit_account_id} className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{account.retailer.name}</CardTitle>
                      <p className="mt-0.5 text-xs text-[#64748B]">
                        Dibuka {formatDate(account.opened_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={riskTone[account.risk_level]}>
                        Risk: {account.risk_level}
                      </Badge>
                      <Badge tone={statusTone[account.status]}>
                        {statusLabel[account.status]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Utilization */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Utilisasi Kredit</span>
                      <span className="font-medium text-[#0F172A]">
                        {account.utilization_pct}%
                      </span>
                    </div>
                    <UtilizationBar pct={account.utilization_pct} />
                    <div className="flex justify-between text-xs text-[#64748B]">
                      <span>Terpakai: {formatCurrency(account.utilized_amount)}</span>
                      <span>Limit: {formatCurrency(account.credit_limit)}</span>
                    </div>
                  </div>

                  {/* Due info */}
                  <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-3">
                    <div>
                      <p className="text-xs text-[#64748B]">Jatuh Tempo Berikutnya</p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {formatDate(account.next_due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#64748B]">Jumlah Tagihan</p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {formatCurrency(account.next_due_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedAccountId(
                          selectedAccountId === account.credit_account_id
                            ? null
                            : account.credit_account_id,
                        )
                      }
                    >
                      Riwayat Repayment
                    </Button>
                    {account.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#F59E0B] hover:text-[#F59E0B]"
                        onClick={() => handleSuspend(account.credit_account_id)}
                        disabled={updateAccount.isPending}
                      >
                        Tangguhkan
                      </Button>
                    )}
                    {account.status === "suspended" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateAccount.mutate({
                            creditAccountId: account.credit_account_id,
                            body: { status: "active" },
                          })
                        }
                        disabled={updateAccount.isPending}
                      >
                        Aktifkan Kembali
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>

      {/* Repayment side panel */}
      {selectedAccountId && selectedAccount && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setSelectedAccountId(null)}
          />
          <RepaymentPanel
            creditAccountId={selectedAccountId}
            retailerName={selectedAccount.retailer.name}
            onClose={() => setSelectedAccountId(null)}
          />
        </>
      )}

      <OpenCreditDialog open={showOpen} onClose={() => setShowOpen(false)} />
    </>
  );
}
