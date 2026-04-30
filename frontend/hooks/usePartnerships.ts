"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type PartnershipSummary = {
  active_partnerships: number;
  pending_agreements: number;
  contract_renewal_rate: number;
  trust_score: number;
  network_growth: number;
};

export type PartnershipInsight = {
  type: string;
  message: string;
  urgency: "high" | "medium" | "low";
  supplier_id?: string;
};

export type PartnershipsResponse = {
  summary: PartnershipSummary;
  insights: PartnershipInsight[];
};

export type PartnershipNFT = {
  distributor_id: string;
  supplier_id: string;
  mint_address: string;
  explorer_url: string;
  token_name: string;
  issued_at: string;
};

export function usePartnershipNFT(supplierId: string | null) {
  const userId = useAuthStore((s) => s.user?.user_id ?? "me");
  return useQuery({
    queryKey: ["partnership-nft", supplierId],
    enabled: !!supplierId,
    queryFn: async (): Promise<PartnershipNFT | null> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        return {
          distributor_id: userId,
          supplier_id: supplierId!,
          mint_address: `${supplierId!.slice(0, 8)}...${supplierId!.slice(-4)}`,
          explorer_url: `https://explorer.solana.com/address/${supplierId}`,
          token_name: "AutoSup Partnership NFT",
          issued_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
      const { data } = await api.get<ApiResponse<PartnershipNFT>>(
        `/blockchain/partnership-nft/${userId}/${supplierId}`,
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePartnershipsSummary() {
  return useQuery({
    queryKey: ["partnerships", "summary"],
    queryFn: async (): Promise<PartnershipsResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 450));
        return {
          summary: {
            active_partnerships: 8,
            pending_agreements: 2,
            contract_renewal_rate: 94,
            trust_score: 92,
            network_growth: 15,
          },
          insights: [
            {
              type: "strategic_partner",
              message: "Supplier X adalah partner strategis dengan nilai tinggi berdasarkan konsistensi pengiriman bulan ini.",
              urgency: "low",
              supplier_id: "supp-x-123",
            },
            {
              type: "expiring_contract",
              message: "Kontrak dengan CV Maju Bersama akan berakhir dalam 30 hari.",
              urgency: "medium",
              supplier_id: "supp-maju-123",
            },
          ],
        };
      }
      const { data } = await api.get<ApiResponse<PartnershipsResponse>>("/partnerships/summary");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
