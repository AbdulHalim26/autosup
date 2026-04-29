"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type RegionData = {
  region: string;
  order_volume: number;
  revenue: number;
  growth_pct: number;
  top_category: string;
};

export type GeoDemandResponse = {
  total_regions_served: number;
  top_growth_region: string;
  regions: RegionData[];
};

export function useGeoDemand() {
  return useQuery({
    queryKey: ["geo-demand"],
    queryFn: async (): Promise<GeoDemandResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          total_regions_served: 12,
          top_growth_region: "Jawa Timur",
          regions: [
            { region: "DKI Jakarta", order_volume: 4500, revenue: 120000000, growth_pct: 12, top_category: "Beverages" },
            { region: "Jawa Barat", order_volume: 3200, revenue: 85000000, growth_pct: 8, top_category: "Packaging" },
            { region: "Jawa Timur", order_volume: 2800, revenue: 72000000, growth_pct: 24, top_category: "Spices" },
            { region: "Banten", order_volume: 1500, revenue: 45000000, growth_pct: 5, top_category: "Beverages" },
            { region: "Bali", order_volume: 850, revenue: 28000000, growth_pct: -2, top_category: "Supplies" },
          ],
        };
      }
      const { data } = await api.get<ApiResponse<GeoDemandResponse>>("/analytics/supplier/regional");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
