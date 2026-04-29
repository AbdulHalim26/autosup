"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type AiAgentStatus = "active" | "inactive" | "learning";

export type AgentKey =
  | "demand_forecast"
  | "auto_restock"
  | "credit_risk"
  | "logistics_optimization"
  | "supplier_recommendation"
  | "price_optimization"
  | "cash_flow_optimizer";

export type AiAgent = {
  id: string;
  agent_key: AgentKey;
  name: string;
  description: string;
  status: AiAgentStatus;
  automation_level: "manual" | "semi-auto" | "auto";
  recent_action: string;
  last_active: string;
};

export type AiActivity = {
  id: string;
  agent_name: string;
  action: string;
  impact: string;
  timestamp: string;
};

export type AiPerformance = {
  accuracy_rate: number;
  cost_savings: number;
  time_saved_hours: number;
};

export type AiAgentsResponse = {
  agents: AiAgent[];
  activities: AiActivity[];
  performance: AiPerformance;
};

const mockAgents: AiAgent[] = [
  {
    id: "agent-1",
    name: "Auto Restock",
    description: "Memantau inventory dan memberikan peringatan restock sebelum kehabisan.",
    status: "active",
    automation_level: "manual",
    recent_action: "Menyarankan restock Tepung Terigu 50kg.",
    last_active: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "agent-2",
    name: "Demand Forecast",
    description: "Memprediksi permintaan masa depan berdasarkan tren dan season.",
    status: "active",
    automation_level: "manual",
    recent_action: "Meningkatkan forecast untuk Kopi Arabika sebesar 15%.",
    last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "agent-3",
    name: "Supplier Recommendation",
    description: "Mencari vendor alternatif dengan harga dan pengiriman lebih baik.",
    status: "learning",
    automation_level: "manual",
    recent_action: "Menganalisis 5 supplier baru di kategori Packaging.",
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "agent-4",
    name: "Price Optimization",
    description: "Menyarankan penyesuaian harga jual berdasarkan harga pokok pembelian.",
    status: "inactive",
    automation_level: "manual",
    recent_action: "-",
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "agent-5",
    name: "Cash Flow Optimizer",
    description: "Mengoptimalkan jadwal pembayaran invoice untuk menjaga likuiditas.",
    status: "active",
    automation_level: "semi-auto",
    recent_action: "Menjadwalkan ulang pembayaran ke CV Maju Bersama.",
    last_active: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export function useAiAgents() {
  return useQuery({
    queryKey: ["ai-agents"],
    queryFn: async (): Promise<AiAgentsResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          agents: mockAgents,
          activities: [
            {
              id: "act-1",
              agent_name: "Cash Flow Optimizer",
              action: "Menyarankan penundaan pembayaran inv-002 selama 3 hari.",
              impact: "Menjaga positive cash flow sebesar Rp3.200.000",
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            },
            {
              id: "act-2",
              agent_name: "Auto Restock",
              action: "Mendeteksi Gula Pasir menyentuh minimum stok.",
              impact: "Mencegah kehabisan stok operasional",
              timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            },
            {
              id: "act-3",
              agent_name: "Demand Forecast",
              action: "Merevisi proyeksi penjualan akhir pekan.",
              impact: "Akurasi pesanan naik 12%",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            },
          ],
          performance: {
            accuracy_rate: 89,
            cost_savings: 1450000,
            time_saved_hours: 18,
          },
        };
      }
      const { data } = await api.get<ApiResponse<AiAgentsResponse>>("/ai/agents");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateAgentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, automation_level }: { id: string; status?: AiAgentStatus; automation_level?: "manual" | "semi-auto" | "auto" }) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        const idx = mockAgents.findIndex((a) => a.id === id);
        if (idx !== -1) {
          if (status) mockAgents[idx].status = status;
          if (automation_level) mockAgents[idx].automation_level = automation_level;
        }
        return { success: true };
      }
      const { data } = await api.put<ApiResponse>(`/ai/agents/${id}/config`, { status, automation_level });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-agents"] });
    },
  });
}
