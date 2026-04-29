"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type DemandInsight = {
  type: string;
  message: string;
  urgency: "high" | "medium" | "low";
};

export type ProductDemand = {
  id: string;
  name: string;
  current_demand: number;
  growth_pct: number;
  trend: "rising" | "stable" | "declining";
};

export type DemandTrendPoint = {
  period: string;
  total_volume: number;
};

export type DemandResponse = {
  insights: DemandInsight[];
  top_rising: ProductDemand[];
  declining: ProductDemand[];
  trends: DemandTrendPoint[];
};

export function useDemandIntelligence(period: "weekly" | "monthly" = "monthly") {
  return useQuery({
    queryKey: ["demand-intelligence", period],
    queryFn: async (): Promise<DemandResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        return {
          insights: [
            {
              type: "production_recommendation",
              message: "Tingkatkan produksi Gula Aren Cair 20% minggu ini untuk mengantisipasi lonjakan permintaan akhir bulan.",
              urgency: "high",
            },
            {
              type: "trend_alert",
              message: "Kopi Robusta mengalami penurunan tren konstan selama 3 minggu terakhir.",
              urgency: "medium",
            },
          ],
          top_rising: [
            { id: "p1", name: "Gula Aren Cair", current_demand: 1250, growth_pct: 24, trend: "rising" },
            { id: "p2", name: "Susu Oat 1L", current_demand: 850, growth_pct: 18, trend: "rising" },
            { id: "p3", name: "Kopi Arabika 1kg", current_demand: 2100, growth_pct: 12, trend: "rising" },
          ],
          declining: [
            { id: "p4", name: "Kopi Robusta 1kg", current_demand: 420, growth_pct: -15, trend: "declining" },
            { id: "p5", name: "Sedotan Kertas", current_demand: 3100, growth_pct: -8, trend: "declining" },
          ],
          trends: period === "monthly" 
            ? [
                { period: "Jan", total_volume: 12000 },
                { period: "Feb", total_volume: 13500 },
                { period: "Mar", total_volume: 13000 },
                { period: "Apr", total_volume: 16000 },
                { period: "May", total_volume: 18500 },
                { period: "Jun", total_volume: 21000 },
              ]
            : [
                { period: "W1", total_volume: 4500 },
                { period: "W2", total_volume: 4800 },
                { period: "W3", total_volume: 5100 },
                { period: "W4", total_volume: 6600 },
              ],
        };
      }
      const { data } = await api.get<ApiResponse<DemandResponse>>(`/analytics/supplier/demand?period=${period}`);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
