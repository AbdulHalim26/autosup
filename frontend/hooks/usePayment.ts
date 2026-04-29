"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type InvoiceStatus = "pending" | "paid" | "overdue";

export type Invoice = {
  invoice_id: string;
  order_id: string;
  vendor_name: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  created_at: string;
};

export type PaymentSummary = {
  total_outstanding: number;
  paid_this_month: number;
  available_credit: number;
  upcoming_due_payments: number;
  payment_success_rate: number;
  credit_utilization_pct: number;
};

export type CashFlowInsight = {
  type: string;
  message: string;
  urgency: "high" | "medium" | "low";
  actionable?: boolean;
};

export type RetailerPaymentResponse = {
  summary: PaymentSummary;
  invoices: Invoice[];
  insights: CashFlowInsight[];
};

const mockInvoices: Invoice[] = [
  {
    invoice_id: "inv-001",
    order_id: "ord-111",
    vendor_name: "Toko Budi Jaya",
    amount: 1500000,
    status: "overdue",
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    invoice_id: "inv-002",
    order_id: "ord-112",
    vendor_name: "CV Maju Bersama",
    amount: 3200000,
    status: "pending",
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    invoice_id: "inv-003",
    order_id: "ord-113",
    vendor_name: "PT Distribusi Nusantara",
    amount: 8500000,
    status: "paid",
    due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function useRetailerPayments() {
  return useQuery({
    queryKey: ["retailer", "payments"],
    queryFn: async (): Promise<RetailerPaymentResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        return {
          summary: {
            total_outstanding: 4700000,
            paid_this_month: 12500000,
            available_credit: 5300000,
            upcoming_due_payments: 2,
            payment_success_rate: 98,
            credit_utilization_pct: 47,
          },
          invoices: mockInvoices,
          insights: [
            {
              type: "cash_flow_optimization",
              message: "Tunda pembayaran invoice CV Maju Bersama 3 hari untuk menjaga buffer cash flow minggu ini.",
              urgency: "medium",
              actionable: true,
            },
            {
              type: "overdue_alert",
              message: "1 invoice dari Toko Budi Jaya telah melewati jatuh tempo. Segera lunasi untuk menghindari penalti.",
              urgency: "high",
              actionable: true,
            },
          ],
        };
      }
      const { data } = await api.get<ApiResponse<RetailerPaymentResponse>>("/payments/retailer");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoice_id: string) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        const idx = mockInvoices.findIndex((i) => i.invoice_id === invoice_id);
        if (idx !== -1) mockInvoices[idx].status = "paid";
        return { success: true };
      }
      const { data } = await api.post<ApiResponse>(`/invoices/${invoice_id}/pay`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retailer", "payments"] });
    },
  });
}
