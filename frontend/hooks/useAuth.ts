"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ApiResponse } from "@/lib/api";
import { useAuthStore, type AuthUser, type UserRole } from "@/store/useAuthStore";

type LoginPayload = {
  email: string;
  password: string;
  recaptcha_token: string;
};

type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  business_name: string;
  phone: string;
};

type LoginResponseData = AuthUser & {
  access_token: string;
  refresh_token: string;
};

type RegisterResponseData = {
  user_id: string;
  email: string;
  role: UserRole;
  access_token: string;
};

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  async function login(payload: LoginPayload) {
    setIsLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay
        setAuth(
          {
            user_id: "mock-user-123",
            email: payload.email,
            role: "distributor", // Default for mock, could be inferred if needed
            full_name: "Mock User",
            business_name: "Mock Business",
          },
          "mock-access-token",
          "mock-refresh-token",
        );
        router.push("/dashboard/dashboard");
        return;
      }

      const { data: res } = await api.post<ApiResponse<LoginResponseData>>("/auth/login", payload);
      const { access_token, refresh_token, ...user } = res.data;
      setAuth(user, access_token, refresh_token);
      router.push("/dashboard/dashboard");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiResponse } };
      const code = apiError.response?.data?.error_code;
      if (code === "CAPTCHA_FAILED" || code === "CAPTCHA_MISSING") {
        setError("Verifikasi gagal, coba lagi.");
      } else {
        setError(apiError.response?.data?.message ?? "Login gagal. Periksa email dan password kamu.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  async function register(payload: RegisterPayload) {
    setIsLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay
        setAuth(
          {
            user_id: "mock-user-456",
            email: payload.email,
            role: payload.role,
            full_name: payload.full_name,
            business_name: payload.business_name,
          },
          "mock-access-token-reg",
          "", // no refresh token on register
        );
        router.push("/dashboard/dashboard");
        return;
      }

      const { data: res } = await api.post<ApiResponse<RegisterResponseData>>("/auth/register", payload);
      // Register returns access_token but not refresh_token — redirect to login for full session
      // Store partial so user lands logged in; refresh_token will be populated on next login
      setAuth(
        {
          user_id: res.data.user_id,
          email: res.data.email,
          role: res.data.role,
          full_name: payload.full_name,
          business_name: payload.business_name,
        },
        res.data.access_token,
        "",
      );
      router.push("/dashboard/dashboard");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiResponse } };
      setError(apiError.response?.data?.message ?? "Registrasi gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading, error };
}

export function useLogout() {
  const { clearAuth, refreshToken } = useAuthStore();
  const router = useRouter();

  async function logout() {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // silently fail — clear local state regardless
    } finally {
      clearAuth();
      router.push("/auth/login");
    }
  }

  return { logout };
}
