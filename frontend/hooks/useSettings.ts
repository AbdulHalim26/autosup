"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileSettings = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "distributor" | "supplier" | "retailer";
  avatar_url: string | null;
};

export type BusinessSettings = {
  business_name: string;
  business_type: string;
  tax_id: string;
  // distributor
  warehouse_locations?: { id: string; name: string; address: string }[];
  service_regions?: string[];
  preferred_currency?: string;
  operational_timezone?: string;
  // retailer-specific
  industry_type?: string;
  branch_locations?: { id: string; name: string; address: string }[];
  billing_subscription?: {
    current_plan: string;
    next_renewal: string;
    payment_method: string;
  };
  team_members_count?: number;
};

export type NotificationSettings = {
  channels: {
    email: boolean;
    in_app: boolean;
    sms: boolean;
  };
  preferences: {
    low_stock_alerts: boolean;
    new_order_alerts: boolean;
    partnership_request_alerts: boolean;
    payment_confirmation: boolean;
    overdue_payment_reminder: boolean;
    ai_recommendation_alerts: boolean;
    weekly_analytics_report: boolean;
  };
};

export type Integration = {
  connected: boolean;
  provider: string | null;
};

export type WalletIntegration = {
  connected: boolean;
  address: string | null;
  network: string | null;
};

export type ApiKey = {
  key_id: string;
  label: string;
  last_used_at: string;
  created_at: string;
};

export type IntegrationsSettings = {
  erp: Integration;
  payment_gateway: Integration;
  wallet: WalletIntegration;
  logistics: Integration;
  api_keys: ApiKey[];
};

export type Session = {
  session_id: string;
  device: string;
  ip: string;
  city: string;
  is_current: boolean;
  last_active_at: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockProfile: ProfileSettings = {
  user_id: "user-uuid-001",
  full_name: "Budi Santoso",
  email: "budi@example.com",
  phone: "08123456789",
  role: "distributor",
  avatar_url: null,
};

const mockBusinessDistributor: BusinessSettings = {
  business_name: "Toko Budi Jaya",
  business_type: "retail_distribution",
  tax_id: "01.234.567.8-901.000",
  warehouse_locations: [
    { id: "wh-001", name: "Gudang Jakarta", address: "Jl. Merdeka No.10, Jakarta" },
    { id: "wh-002", name: "Gudang Bekasi", address: "Jl. Industri No.5, Bekasi" },
  ],
  service_regions: ["Jakarta", "Bekasi", "Bogor"],
  preferred_currency: "IDR",
  operational_timezone: "Asia/Jakarta",
};

const mockBusinessSupplier: BusinessSettings = {
  business_name: "CV Maju Bersama",
  business_type: "food_supplier",
  tax_id: "02.345.678.9-012.000",
  service_regions: ["Jakarta", "Bandung", "Surabaya"],
  preferred_currency: "IDR",
  operational_timezone: "Asia/Jakarta",
};

const mockBusinessRetailer: BusinessSettings = {
  business_name: "Kafe Senja",
  business_type: "cafe",
  tax_id: "03.456.789.0-123.000",
  industry_type: "food_and_beverage",
  branch_locations: [
    { id: "br-001", name: "Cabang Sudirman", address: "Jl. Sudirman No.25, Jakarta" },
  ],
  billing_subscription: {
    current_plan: "Pro",
    next_renewal: "2026-05-29",
    payment_method: "Kartu Kredit BCA",
  },
  team_members_count: 5,
  preferred_currency: "IDR",
  operational_timezone: "Asia/Jakarta",
};

const mockNotifications: NotificationSettings = {
  channels: { email: true, in_app: true, sms: false },
  preferences: {
    low_stock_alerts: true,
    new_order_alerts: true,
    partnership_request_alerts: true,
    payment_confirmation: true,
    overdue_payment_reminder: true,
    ai_recommendation_alerts: true,
    weekly_analytics_report: false,
  },
};

const mockIntegrations: IntegrationsSettings = {
  erp: { connected: false, provider: null },
  payment_gateway: { connected: true, provider: "xendit" },
  wallet: { connected: true, address: "So1ana...xyz", network: "solana_devnet" },
  logistics: { connected: false, provider: null },
  api_keys: [
    {
      key_id: "key-001",
      label: "Primary integration",
      last_used_at: "2026-04-28T10:00:00Z",
      created_at: "2026-01-15T00:00:00Z",
    },
  ],
};

const mockSessions: Session[] = [
  {
    session_id: "sess-001",
    device: "Chrome on Windows",
    ip: "180.247.x.x",
    city: "Jakarta",
    is_current: true,
    last_active_at: new Date().toISOString(),
  },
  {
    session_id: "sess-002",
    device: "Safari on iPhone",
    ip: "182.1.x.x",
    city: "Bekasi",
    is_current: false,
    last_active_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProfileSettings() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: async (): Promise<ProfileSettings> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return mockProfile;
      }
      const { data } = await api.get<ApiResponse<ProfileSettings>>("/settings/profile");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Pick<ProfileSettings, "full_name" | "phone" | "avatar_url">>) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        Object.assign(mockProfile, body);
        return mockProfile;
      }
      const { data } = await api.put<ApiResponse<ProfileSettings>>("/settings/profile", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "profile"] }),
  });
}

export function useBusinessSettings(role?: string) {
  return useQuery({
    queryKey: ["settings", "business"],
    queryFn: async (): Promise<BusinessSettings> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        if (role === "supplier") return mockBusinessSupplier;
        if (role === "retailer") return mockBusinessRetailer;
        return mockBusinessDistributor;
      }
      const { data } = await api.get<ApiResponse<BusinessSettings>>("/settings/business");
      return data.data;
    },
    staleTime: 60 * 1000,
    enabled: !!role,
  });
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<BusinessSettings>) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return body;
      }
      const { data } = await api.put<ApiResponse<BusinessSettings>>("/settings/business", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "business"] }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: async (): Promise<NotificationSettings> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        return { ...mockNotifications };
      }
      const { data } = await api.get<ApiResponse<NotificationSettings>>("/settings/notifications");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<NotificationSettings>) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        Object.assign(mockNotifications, body);
        return mockNotifications;
      }
      const { data } = await api.put<ApiResponse<NotificationSettings>>(
        "/settings/notifications",
        body,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "notifications"] }),
  });
}

export function useIntegrationsSettings() {
  return useQuery({
    queryKey: ["settings", "integrations"],
    queryFn: async (): Promise<IntegrationsSettings> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return mockIntegrations;
      }
      const { data } = await api.get<ApiResponse<IntegrationsSettings>>("/settings/integrations");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSessionsSettings() {
  return useQuery({
    queryKey: ["settings", "sessions"],
    queryFn: async (): Promise<Session[]> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        return mockSessions;
      }
      const { data } = await api.get<ApiResponse<{ sessions: Session[] }>>(
        "/settings/security/sessions",
      );
      return data.data.sessions;
    },
    staleTime: 30 * 1000,
  });
}

export function useEnable2FA() {
  return useMutation({
    mutationFn: async (): Promise<{ secret: string; qr_code_url: string }> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        return {
          secret: "JBSWY3DPEHPK3PXP",
          qr_code_url:
            "otpauth://totp/AUTOSUP:budi@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AUTOSUP",
        };
      }
      const { data } = await api.post<ApiResponse<{ secret: string; qr_code_url: string }>>(
        "/settings/security/2fa/enable",
      );
      return data.data;
    },
  });
}

export function useDisable2FA() {
  return useMutation({
    mutationFn: async (totp_code: string): Promise<void> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        return;
      }
      await api.post("/settings/security/2fa/disable", { totp_code });
    },
  });
}
