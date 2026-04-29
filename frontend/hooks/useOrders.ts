"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";
import { getMockOrders, getMockOrderDetail, mockOrders } from "@/lib/mocks/orders";
import { useAuthStore } from "@/store/useAuthStore";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "processing" | "shipping" | "delivered" | "cancelled";
export type EscrowStatus = "held" | "released" | "refunded";

export type OrderParty = {
  id: string;
  name: string;
  role: "distributor" | "supplier";
};

export type OrderItem = {
  item_name: string;
  qty: number;
  unit: string;
  price_per_unit: number;
  subtotal: number;
};

export type StatusHistoryEntry = {
  status: OrderStatus;
  changed_at: string;
};

export type Order = {
  order_id: string;
  order_number: string;
  buyer: OrderParty;
  seller: OrderParty;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  escrow_status: EscrowStatus;
  delivery_address: string;
  estimated_delivery: string;
  created_at: string;
  updated_at: string;
};

export type OrderDetail = Order & {
  notes: string | null;
  status_history: StatusHistoryEntry[];
};

export type OrdersResponse = {
  orders: Order[];
  summary: {
    total_orders: number;
    active_orders: number;
    pending_orders: number;
    shipping_orders: number;
    delivered_this_month: number;
  };
  pagination: { page: number; limit: number; total: number };
};

export type CreateOrderPayload = {
  supplier_id: string;
  items: {
    item_name: string;
    qty: number;
    unit: string;
    price_per_unit: number;
  }[];
  delivery_address: string;
  notes?: string;
};

export type CreateOrderResponse = {
  order_id: string;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  escrow_status: EscrowStatus;
  created_at: string;
};

type OrderFilters = {
  status?: OrderStatus;
  role?: "buyer" | "seller";
  page?: number;
  limit?: number;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async (): Promise<OrdersResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return getMockOrders(filters);
      }
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.role) params.set("role", filters.role);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      const { data } = await api.get<ApiResponse<OrdersResponse>>(
        `/orders?${params.toString()}`,
      );
      return data.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: async (): Promise<OrderDetail> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 350));
        const order = getMockOrderDetail(orderId!);
        if (!order) throw new Error("Order tidak ditemukan");
        return order;
      }
      const { data } = await api.get<ApiResponse<OrderDetail>>(`/orders/${orderId}`);
      return data.data;
    },
    enabled: !!orderId,
    staleTime: 30 * 1000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        const total = payload.items.reduce(
          (sum, i) => sum + i.qty * i.price_per_unit,
          0,
        );
        const user = useAuthStore.getState().user;
        const newOrder: OrderDetail = {
          order_id: `order-uuid-${Date.now()}`,
          order_number: `ORD-2026-${String(mockOrders.length + 1).padStart(3, "0")}`,
          buyer: { 
            id: user?.user_id ?? "user-uuid-buyer-001", 
            name: user?.business_name ?? "Toko Budi Jaya", 
            role: (user?.role as "distributor" | "supplier") ?? "distributor" 
          },
          seller: { id: payload.supplier_id, name: "Supplier", role: "supplier" },
          items: payload.items.map((i) => ({
            ...i,
            subtotal: i.qty * i.price_per_unit,
          })),
          total_amount: total,
          status: "pending",
          escrow_status: "held",
          delivery_address: payload.delivery_address,
          notes: payload.notes ?? null,
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          status_history: [{ status: "pending", changed_at: new Date().toISOString() }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockOrders.push(newOrder);
        return {
          order_id: newOrder.order_id,
          order_number: newOrder.order_number,
          total_amount: newOrder.total_amount,
          status: newOrder.status,
          escrow_status: newOrder.escrow_status,
          created_at: newOrder.created_at,
        };
      }
      const { data } = await api.post<ApiResponse<CreateOrderResponse>>("/orders", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }): Promise<{ order_id: string; status: OrderStatus; updated_at: string }> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        const idx = mockOrders.findIndex((o) => o.order_id === orderId);
        if (idx === -1) throw new Error("Order tidak ditemukan");
        mockOrders[idx].status = status;
        mockOrders[idx].updated_at = new Date().toISOString();
        if (status === "delivered") mockOrders[idx].escrow_status = "released";
        if (status === "cancelled") mockOrders[idx].escrow_status = "refunded";
        mockOrders[idx].status_history.push({
          status,
          changed_at: new Date().toISOString(),
        });
        return { order_id: orderId, status, updated_at: mockOrders[idx].updated_at };
      }
      const { data } = await api.put<
        ApiResponse<{ order_id: string; status: OrderStatus; updated_at: string }>
      >(`/orders/${orderId}/status`, { status });
      return data.data;
    },
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}
