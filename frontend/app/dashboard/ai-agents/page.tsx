"use client";


import { 
  Bot, 
  BrainCircuit, 
  Clock, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Zap 
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiAgents, useUpdateAgentConfig } from "@/hooks/useAiAgents";
import { useAuthStore } from "@/store/useAuthStore";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusTone = { active: "success", inactive: "neutral", learning: "warning" } as const;
const statusLabel = { active: "Aktif", inactive: "Nonaktif", learning: "Learning" } as const;

export default function AiAgentsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useAiAgents();
  const updateConfig = useUpdateAgentConfig();

  if (role !== "retailer" && role !== "distributor") {
    return (
      <main className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0F172A]">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-[#64748B]">Halaman AI Agents ini dikhususkan untuk Retailer atau Distributor.</p>
        </div>
      </main>
    );
  }

  const agents = data?.agents ?? [];
  const performance = data?.performance;
  const activities = data?.activities ?? [];

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge tone="info">Intelligence core</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">AI Agents</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Konfigurasi agent AI, atur automation level, dan lihat dampak prediksi serta penghematan secara real-time.
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      {performance && (
        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Prediction Accuracy"
            value={`${performance.accuracy_rate}%`}
            meta="Akurasi model AI saat ini"
            tone="success"
            icon={BrainCircuit}
          />
          <KpiCard
            label="Est. Cost Savings"
            value={formatCurrency(performance.cost_savings)}
            meta="Penghematan dari optimasi"
            tone="success"
            icon={TrendingUp}
          />
          <KpiCard
            label="Time Saved"
            value={`${performance.time_saved_hours} Jam`}
            meta="Otomasi tugas manual"
            tone="info"
            icon={Clock}
          />
        </section>
      )}

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1fr_0.5fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Active Agents</h2>
          
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
            </div>
          ) : agents.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <span className="text-sm font-medium text-[#0F172A]">Belum ada agent</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <Card key={agent.id} className="rounded-2xl flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {agent.name}
                        <Badge tone={statusTone[agent.status]} className="text-[10px] px-1.5 py-0">
                          {statusLabel[agent.status]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-[#64748B] line-clamp-2">{agent.description}</p>
                    </div>
                    <div className="rounded-xl bg-[#EFF6FF] p-2 text-[#2563EB]">
                      <Bot className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4 pt-4">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-[#64748B]">Recent Action</p>
                      <p className="mt-1 text-sm text-[#0F172A]">{agent.recent_action}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                      <div className="space-y-1">
                        <p className="text-xs text-[#64748B]">Automation Level</p>
                        <select
                          className="h-8 rounded border border-[#E2E8F0] bg-white px-2 text-xs font-medium text-[#0F172A] outline-none"
                          value={agent.automation_level}
                          disabled={updateConfig.isPending}
                          onChange={(e) => {
                            const val = e.target.value as "manual" | "semi-auto" | "auto";
                            updateConfig.mutate({ id: agent.id, automation_level: val });
                          }}
                        >
                          <option value="manual">Manual Approval</option>
                          <option value="semi-auto">Semi-Auto</option>
                          {/* MVP warning for auto execute handling */}
                          <option value="auto">Auto-Execute (Disabled)</option>
                        </select>
                      </div>
                      
                      <Button 
                        variant={agent.status === "active" ? "secondary" : "primary"}
                        disabled={updateConfig.isPending}
                        onClick={() => {
                          const newStatus = agent.status === "active" ? "inactive" : "active";
                          updateConfig.mutate({ id: agent.id, status: newStatus });
                        }}
                      >
                        {agent.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
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
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#F59E0B]" />
                <CardTitle className="text-base">Activity Log</CardTitle>
              </div>
              <p className="text-sm text-[#64748B]">Audit trail tindakan AI agents</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center">Belum ada aktivitas.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div key={act.id} className="relative pl-4 border-l border-[#E2E8F0] pb-2 last:pb-0">
                      <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#3B82F6]" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#0F172A]">{act.agent_name}</p>
                        <p className="text-sm text-[#64748B]">{act.action}</p>
                        <p className="text-xs text-[#22C55E] flex items-center gap-1 mt-1">
                          <Sparkles className="h-3 w-3" />
                          {act.impact}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] pt-1">
                          {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(act.timestamp))}
                        </p>
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
