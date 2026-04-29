"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  mockDistributorSummary,
  mockSupplierSummary,
  mockRetailerSummary,
} from "@/lib/mocks/dashboard";

export type AiInsight = {
  type: string;
  message: string;
  urgency: "high" | "medium" | "low";
  item_id: string;
};

type DistributorSummaryData = {
  role: "distributor";
  inventory: { total_items: number; low_stock_count: number; out_of_stock_count: number };
  orders: { active_orders: number; pending_orders: number; completed_this_month: number };
  suppliers: { partner_count: number; pending_requests: number };
  ai_insights: AiInsight[];
};

type SupplierSummaryData = {
  role: "supplier";
  products: { total_active: number; low_stock_count: number; out_of_stock_count: number };
  orders: { incoming_orders: number; processing: number; completed_this_month: number };
  partners: { distributor_count: number; pending_requests: number };
  ai_insights: AiInsight[];
};

type RetailerSummaryData = {
  role: "retailer";
  inventory: { total_items: number; low_stock_count: number; out_of_stock_count: number };
  orders: {
    active_orders: number;
    pending_approval: number;
    in_transit: number;
    completed_this_month: number;
    order_accuracy_rate: number;
  };
  spending: {
    total_outstanding: number;
    monthly_spending: number;
    available_credit: number;
    upcoming_due_payments: number;
    payment_success_rate: number;
  };
  suppliers: {
    active_partnered: number;
    pending_requests: number;
    average_reliability_score: number;
    avg_delivery_time: number;
  };
  forecast_accuracy_pct: number;
  ai_insights: AiInsight[];
};

export type DashboardSummary =
  | DistributorSummaryData
  | SupplierSummaryData
  | RetailerSummaryData;

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function fetchDashboardSummary(
  role: "distributor" | "supplier" | "retailer",
): Promise<DashboardSummary> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400)); // simulate network
    if (role === "supplier") return mockSupplierSummary;
    if (role === "retailer") return mockRetailerSummary;
    return mockDistributorSummary;
  }
  const { data } = await api.get<ApiResponse<Omit<DashboardSummary, "role">>>("/dashboard/summary");
  return { ...data.data, role } as DashboardSummary;
}

export function useDashboard() {
  const role = useAuthStore((s) => s.user?.role) ?? "distributor";

  return useQuery({
    queryKey: ["dashboard", "summary", role],
    queryFn: () => fetchDashboardSummary(role),
    staleTime: 60 * 1000,
  });
}
