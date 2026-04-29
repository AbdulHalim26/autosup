"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type AnalyticsSummary = {
  revenue_growth: number;
  inventory_turnover: number;
  supplier_performance: number;
  order_fulfillment_rate: number;
  forecast_accuracy: number;
};

export type TrendDataPoint = {
  label: string;
  revenue: number;
  spending: number;
};

export type AnalyticsResponse = {
  summary: AnalyticsSummary;
  trends: TrendDataPoint[];
  top_products: { name: string; sales: number }[];
};

export function useRetailerAnalytics() {
  return useQuery({
    queryKey: ["analytics", "retailer"],
    queryFn: async (): Promise<AnalyticsResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          summary: {
            revenue_growth: 14.2,
            inventory_turnover: 5.8,
            supplier_performance: 92,
            order_fulfillment_rate: 98,
            forecast_accuracy: 86,
          },
          trends: [
            { label: "Jan", revenue: 12000000, spending: 8000000 },
            { label: "Feb", revenue: 15000000, spending: 9500000 },
            { label: "Mar", revenue: 14500000, spending: 9000000 },
            { label: "Apr", revenue: 18000000, spending: 11000000 },
            { label: "May", revenue: 21000000, spending: 13000000 },
            { label: "Jun", revenue: 24500000, spending: 14500000 },
          ],
          top_products: [
            { name: "Kopi Arabika 1kg", sales: 120 },
            { name: "Susu UHT 1L", sales: 85 },
            { name: "Gula Aren Cair", sales: 64 },
          ],
        };
      }
      const { data } = await api.get<ApiResponse<AnalyticsResponse>>("/analytics/retailer/overview");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
