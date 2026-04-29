"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";
import { getMockInventory, mockInventoryItems } from "@/lib/mocks/inventory";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  unit: string;
  status: InventoryStatus;
  last_updated: string;
};

export type InventoryResponse = {
  items: InventoryItem[];
  summary: {
    total_items: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };
  pagination: { page: number; limit: number; total: number };
};

export type AddItemPayload = {
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  unit: string;
};

export type UpdateItemPayload = Partial<AddItemPayload>;

export type RestockRecommendation = {
  item_id: string;
  item_name: string;
  current_stock: number;
  min_stock: number;
  recommendation: string;
  suggested_qty: number;
  suggested_unit: string;
  suggested_supplier: {
    supplier_id: string;
    name: string;
    reputation_score: number;
    estimated_delivery_days: number;
  } | null;
  urgency: "high" | "medium" | "low";
  generated_at: string;
};

type InventoryFilters = {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: async (): Promise<InventoryResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 350));
        return getMockInventory(filters);
      }
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      const { data } = await api.get<ApiResponse<InventoryResponse>>(
        `/inventory?${params.toString()}`,
      );
      return data.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useAddInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddItemPayload): Promise<InventoryItem> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        const stock = payload.stock;
        const min = payload.min_stock;
        const status: InventoryStatus =
          stock === 0 ? "out_of_stock" : stock < min ? "low_stock" : "in_stock";
        const newItem: InventoryItem = {
          id: `item-uuid-${Date.now()}`,
          ...payload,
          status,
          last_updated: new Date().toISOString(),
        };
        mockInventoryItems.push(newItem);
        return newItem;
      }
      const { data } = await api.post<ApiResponse<InventoryItem>>("/inventory", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateItemPayload;
    }): Promise<InventoryItem> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        const idx = mockInventoryItems.findIndex((i) => i.id === id);
        if (idx === -1) throw new Error("Item tidak ditemukan");
        const updated = { ...mockInventoryItems[idx], ...payload };
        const stock = updated.stock;
        const min = updated.min_stock;
        updated.status =
          stock === 0 ? "out_of_stock" : stock < min ? "low_stock" : "in_stock";
        updated.last_updated = new Date().toISOString();
        mockInventoryItems[idx] = updated;
        return updated;
      }
      const { data } = await api.put<ApiResponse<InventoryItem>>(
        `/inventory/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 350));
        const idx = mockInventoryItems.findIndex((i) => i.id === id);
        if (idx !== -1) mockInventoryItems.splice(idx, 1);
        return;
      }
      await api.delete(`/inventory/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useRestockRecommendation() {
  return useMutation({
    mutationFn: async (item_id: string): Promise<RestockRecommendation> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        const item = mockInventoryItems.find((i) => i.id === item_id);
        return {
          item_id,
          item_name: item?.name ?? "Item",
          current_stock: item?.stock ?? 0,
          min_stock: item?.min_stock ?? 0,
          recommendation: `Stok ${item?.name} tinggal ${item?.stock} ${item?.unit}, jauh di bawah batas minimum ${item?.min_stock} ${item?.unit}. Disarankan restock segera.`,
          suggested_qty: (item?.min_stock ?? 50) * 2,
          suggested_unit: item?.unit ?? "pcs",
          suggested_supplier: {
            supplier_id: "supplier-uuid-001",
            name: "CV Maju Bersama",
            reputation_score: 92,
            estimated_delivery_days: 2,
          },
          urgency: item && item.stock < item.min_stock * 0.3 ? "high" : "medium",
          generated_at: new Date().toISOString(),
        };
      }
      const { data } = await api.post<ApiResponse<RestockRecommendation>>(
        "/ai/restock-recommendation",
        { item_id },
      );
      return data.data;
    },
  });
}
