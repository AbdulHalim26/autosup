"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck, AlertCircle, Building2, Truck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/useAuth";
import type { UserRole } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; description: string; icon: typeof Building2 }[] = [
  {
    value: "distributor",
    label: "Distributor",
    description: "Beli dari supplier, kelola stok dan order ke retailer",
    icon: Truck,
  },
  {
    value: "supplier",
    label: "Supplier",
    description: "Jual produk, terima dan proses order dari distributor",
    icon: Building2,
  },
  {
    value: "retailer",
    label: "Retailer",
    description: "Kelola stok operasional dan beli dari vendor pilihan",
    icon: ShoppingBag,
  },
];

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("distributor");
  const { register, isLoading, error } = useRegister();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await register({
      full_name: fullName,
      email,
      password,
      role,
      business_name: businessName,
      phone,
    });
  }

  return (
    <Card className="w-full max-w-md rounded-2xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">Daftar ke AUTOSUP</CardTitle>
        <CardDescription>Buat akun dan pilih role bisnis kamu.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0F172A]">Role bisnis</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  disabled={isLoading}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    role === value
                      ? "border-[#3B82F6] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      role === value ? "text-[#3B82F6]" : "text-[#94A3B8]",
                    )}
                  />
                  <p className="mt-2 text-xs font-semibold text-[#0F172A]">{label}</p>
                  <p className="mt-0.5 text-xs leading-4 text-[#64748B]">{description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]" htmlFor="fullName">
              Nama lengkap
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Budi Santoso"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]" htmlFor="businessName">
              Nama bisnis
            </label>
            <Input
              id="businessName"
              type="text"
              placeholder="Toko Budi Jaya"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]" htmlFor="reg-email">
              Email
            </label>
            <Input
              id="reg-email"
              type="email"
              placeholder="nama@bisnis.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]" htmlFor="phone">
              Nomor HP
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0F172A]" htmlFor="reg-password">
              Password
            </label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-sm text-[#DC2626]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            className="w-full gap-2"
            type="submit"
            disabled={isLoading || !fullName || !email || !password || !businessName || !phone}
          >
            {isLoading ? "Mendaftarkan..." : "Buat Akun"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="text-center text-sm text-[#64748B]">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="font-medium text-[#3B82F6] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
