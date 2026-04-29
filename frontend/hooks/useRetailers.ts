"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RetailerSegment = "premium" | "regular" | "new";
export type RetailerStatus = "active" | "inactive" | "high_risk";
export type RiskLevel = "low" | "medium" | "high";

export type Retailer = {
  retailer_id: string;
  name: string;
  contact_person: string;
  phone: string;
  city: string;
  segment: RetailerSegment;
  status: RetailerStatus;
  monthly_order_volume: number;
  total_purchase_amount: number;
  last_order_at: string;
};

export type RetailerDetail = Retailer & {
  email: string;
  address: string;
  purchase_history: {
    order_id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
  demand_intelligence: {
    top_products: { item_name: string; qty_last_30d: number; unit: string }[];
    order_frequency_per_month: number;
    forecast_growth_pct: number;
  };
  credit_summary: {
    has_active_credit: boolean;
    credit_limit: number;
    outstanding_balance: number;
    risk_level: RiskLevel;
  } | null;
};

export type RetailersResponse = {
  retailers: Retailer[];
  summary: {
    total_active: number;
    high_risk_count: number;
    retention_rate: number;
  };
  pagination: { page: number; limit: number; total: number };
};

export type AddRetailerPayload = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  segment: RetailerSegment;
};

type RetailerFilters = {
  segment?: RetailerSegment;
  status?: RetailerStatus;
  search?: string;
  page?: number;
  limit?: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockRetailers: Retailer[] = [
  {
    retailer_id: "retailer-uuid-001",
    name: "Toko Sumber Rejeki",
    contact_person: "Ibu Sari",
    phone: "08123456789",
    city: "Jakarta",
    segment: "premium",
    status: "active",
    monthly_order_volume: 12,
    total_purchase_amount: 25000000,
    last_order_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    retailer_id: "retailer-uuid-002",
    name: "Warung Bu Tini",
    contact_person: "Bu Tini",
    phone: "08234567890",
    city: "Bekasi",
    segment: "regular",
    status: "active",
    monthly_order_volume: 6,
    total_purchase_amount: 10500000,
    last_order_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    retailer_id: "retailer-uuid-003",
    name: "Restoran Padang Jaya",
    contact_person: "Pak Andi",
    phone: "08345678901",
    city: "Bandung",
    segment: "premium",
    status: "active",
    monthly_order_volume: 18,
    total_purchase_amount: 38000000,
    last_order_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    retailer_id: "retailer-uuid-004",
    name: "Bakery Sweet Corner",
    contact_person: "Mbak Dinda",
    phone: "08456789012",
    city: "Surabaya",
    segment: "new",
    status: "active",
    monthly_order_volume: 3,
    total_purchase_amount: 4200000,
    last_order_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    retailer_id: "retailer-uuid-005",
    name: "Kedai Kopi Nusantara",
    contact_person: "Pak Hendra",
    phone: "08567890123",
    city: "Yogyakarta",
    segment: "regular",
    status: "high_risk",
    monthly_order_volume: 4,
    total_purchase_amount: 6800000,
    last_order_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useRetailers(filters: RetailerFilters = {}) {
  return useQuery({
    queryKey: ["retailers", filters],
    queryFn: async (): Promise<RetailersResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 450));
        let list = [...mockRetailers];
        if (filters.segment) list = list.filter((r) => r.segment === filters.segment);
        if (filters.status) list = list.filter((r) => r.status === filters.status);
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (r) =>
              r.name.toLowerCase().includes(q) ||
              r.city.toLowerCase().includes(q) ||
              r.contact_person.toLowerCase().includes(q),
          );
        }
        return {
          retailers: list,
          summary: {
            total_active: mockRetailers.filter((r) => r.status === "active").length,
            high_risk_count: mockRetailers.filter((r) => r.status === "high_risk").length,
            retention_rate: 0.91,
          },
          pagination: { page: 1, limit: 20, total: list.length },
        };
      }
      const params = new URLSearchParams();
      if (filters.segment) params.set("segment", filters.segment);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      const { data } = await api.get<ApiResponse<RetailersResponse>>(
        `/retailers?${params.toString()}`,
      );
      return data.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useRetailerDetail(retailerId: string | null) {
  return useQuery({
    queryKey: ["retailers", retailerId],
    queryFn: async (): Promise<RetailerDetail> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        const base = mockRetailers.find((r) => r.retailer_id === retailerId);
        if (!base) throw new Error("Retailer tidak ditemukan");
        return {
          ...base,
          email: `${base.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
          address: `Jl. Merdeka No.${Math.floor(Math.random() * 50) + 1}, ${base.city}`,
          purchase_history: [
            {
              order_id: "order-uuid-010",
              order_number: "ORD-2026-010",
              total_amount: 2400000,
              status: "delivered",
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              order_id: "order-uuid-008",
              order_number: "ORD-2026-008",
              total_amount: 1800000,
              status: "delivered",
              created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          demand_intelligence: {
            top_products: [
              { item_name: "Tepung Terigu", qty_last_30d: 80, unit: "kg" },
              { item_name: "Gula Pasir", qty_last_30d: 45, unit: "kg" },
            ],
            order_frequency_per_month: base.monthly_order_volume,
            forecast_growth_pct: 15,
          },
          credit_summary: {
            has_active_credit: base.segment === "premium",
            credit_limit: 10000000,
            outstanding_balance: 3200000,
            risk_level: base.status === "high_risk" ? "high" : "low",
          },
        };
      }
      const { data } = await api.get<ApiResponse<RetailerDetail>>(`/retailers/${retailerId}`);
      return data.data;
    },
    enabled: !!retailerId,
    staleTime: 30 * 1000,
  });
}

export function useAddRetailer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddRetailerPayload): Promise<Retailer> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        const newRetailer: Retailer = {
          retailer_id: `retailer-uuid-${Date.now()}`,
          name: payload.name,
          contact_person: payload.contact_person,
          phone: payload.phone,
          city: payload.city,
          segment: payload.segment,
          status: "active",
          monthly_order_volume: 0,
          total_purchase_amount: 0,
          last_order_at: new Date().toISOString(),
        };
        mockRetailers.push(newRetailer);
        return newRetailer;
      }
      const { data } = await api.post<ApiResponse<Retailer>>("/retailers", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retailers"] }),
  });
}

export function useUpdateRetailer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      retailerId,
      body,
    }: {
      retailerId: string;
      body: Partial<Pick<Retailer, "phone" | "segment" | "status">>;
    }): Promise<Retailer> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        const idx = mockRetailers.findIndex((r) => r.retailer_id === retailerId);
        if (idx === -1) throw new Error("Retailer tidak ditemukan");
        Object.assign(mockRetailers[idx], body);
        return mockRetailers[idx];
      }
      const { data } = await api.put<ApiResponse<Retailer>>(`/retailers/${retailerId}`, body);
      return data.data;
    },
    onSuccess: (_data, { retailerId }) => {
      qc.invalidateQueries({ queryKey: ["retailers"] });
      qc.invalidateQueries({ queryKey: ["retailers", retailerId] });
    },
  });
}
