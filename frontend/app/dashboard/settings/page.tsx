"use client";

import { useState } from "react";
import {
  Bell,
  Building2,
  Key,
  Loader2,
  Lock,
  Monitor,
  Plug,
  Save,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useProfileSettings,
  useUpdateProfile,
  useBusinessSettings,
  useUpdateBusiness,
  useNotificationSettings,
  useUpdateNotifications,
  useIntegrationsSettings,
  useSessionsSettings,
  useEnable2FA,
  useDisable2FA,
} from "@/hooks/useSettings";
import { useAuthStore } from "@/store/useAuthStore";

type Tab = "profile" | "business" | "notifications" | "security" | "integrations";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "business", label: "Bisnis", icon: Building2 },
  { id: "notifications", label: "Notifikasi", icon: Bell },
  { id: "security", label: "Keamanan", icon: Shield },
  { id: "integrations", label: "Integrasi", icon: Plug },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { data, isLoading } = useProfileSettings();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saved, setSaved] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
      </div>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const body: { full_name?: string; phone?: string } = {};
    if (form.full_name) body.full_name = form.full_name;
    if (form.phone) body.phone = form.phone;
    updateProfile.mutate(body, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{data.full_name}</p>
              <p className="text-xs text-[#64748B]">{data.email}</p>
              <Badge tone="info" className="mt-1 capitalize">
                {data.role}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input
                defaultValue={data.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder={data.full_name}
              />
            </div>
            <div className="space-y-1.5">
              <Label>No. Telepon</Label>
              <Input
                defaultValue={data.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={data.phone}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={data.email} disabled className="text-[#94A3B8]" />
              <p className="text-xs text-[#94A3B8]">Email tidak dapat diubah.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Perubahan
        </Button>
        {saved && (
          <span className="text-sm text-[#22C55E]">Profil berhasil diperbarui.</span>
        )}
      </div>
    </form>
  );
}

// ─── Business Tab ─────────────────────────────────────────────────────────────

function BusinessTab() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useBusinessSettings(role);
  const updateBusiness = useUpdateBusiness();
  const [saved, setSaved] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
      </div>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateBusiness.mutate(
      {},
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Informasi Bisnis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nama Bisnis</Label>
              <Input defaultValue={data.business_name} readOnly className="bg-[#F8FAFC]" />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Bisnis</Label>
              <Input defaultValue={data.business_type} readOnly className="bg-[#F8FAFC]" />
            </div>
            <div className="space-y-1.5">
              <Label>NPWP</Label>
              <Input defaultValue={data.tax_id} readOnly className="bg-[#F8FAFC]" />
            </div>
            {data.preferred_currency && (
              <div className="space-y-1.5">
                <Label>Mata Uang</Label>
                <Input defaultValue={data.preferred_currency} readOnly className="bg-[#F8FAFC]" />
              </div>
            )}
            {data.operational_timezone && (
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Input
                  defaultValue={data.operational_timezone}
                  readOnly
                  className="bg-[#F8FAFC]"
                />
              </div>
            )}
          </div>

          {/* Distributor: warehouse + service regions */}
          {data.warehouse_locations && data.warehouse_locations.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label>Lokasi Gudang</Label>
              <div className="space-y-2">
                {data.warehouse_locations.map((wh) => (
                  <div
                    key={wh.id}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
                  >
                    <p className="text-sm font-medium text-[#0F172A]">{wh.name}</p>
                    <p className="text-xs text-[#64748B]">{wh.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.service_regions && data.service_regions.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label>Area Layanan</Label>
              <div className="flex flex-wrap gap-2">
                {data.service_regions.map((r) => (
                  <Badge key={r} tone="info">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Retailer: branch + billing */}
          {data.branch_locations && data.branch_locations.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label>Lokasi Cabang</Label>
              <div className="space-y-2">
                {data.branch_locations.map((br) => (
                  <div
                    key={br.id}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
                  >
                    <p className="text-sm font-medium text-[#0F172A]">{br.name}</p>
                    <p className="text-xs text-[#64748B]">{br.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.billing_subscription && (
            <div className="space-y-2 pt-2">
              <Label>Langganan</Label>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Plan</span>
                  <Badge tone="success">{data.billing_subscription.current_plan}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Perpanjangan</span>
                  <span className="font-medium text-[#0F172A]">
                    {data.billing_subscription.next_renewal}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Metode Bayar</span>
                  <span className="font-medium text-[#0F172A]">
                    {data.billing_subscription.payment_method}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateBusiness.isPending} className="gap-2">
          {updateBusiness.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan
        </Button>
        {saved && <span className="text-sm text-[#22C55E]">Tersimpan.</span>}
      </div>
    </form>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const { data, isLoading } = useNotificationSettings();
  const updateNotifications = useUpdateNotifications();
  const [saved, setSaved] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
      </div>
    );
  }

  const channelLabels: Record<keyof typeof data.channels, string> = {
    email: "Email",
    in_app: "In-App",
    sms: "SMS",
  };

  const prefLabels: Record<keyof typeof data.preferences, string> = {
    low_stock_alerts: "Alert Stok Rendah",
    new_order_alerts: "Pesanan Baru",
    partnership_request_alerts: "Request Partnership",
    payment_confirmation: "Konfirmasi Pembayaran",
    overdue_payment_reminder: "Pengingat Jatuh Tempo",
    ai_recommendation_alerts: "Rekomendasi AI",
    weekly_analytics_report: "Laporan Mingguan",
  };

  type ChannelKey = "email" | "in_app" | "sms";
  type PrefKey = "low_stock_alerts" | "new_order_alerts" | "partnership_request_alerts" | "payment_confirmation" | "overdue_payment_reminder" | "ai_recommendation_alerts" | "weekly_analytics_report";

  const notifData = data;

  function handleChannelToggle(key: ChannelKey) {
    updateNotifications.mutate(
      { channels: { ...notifData.channels, [key]: !notifData.channels[key] } },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
    );
  }

  function handlePrefToggle(key: PrefKey) {
    updateNotifications.mutate(
      { preferences: { ...notifData.preferences, [key]: !notifData.preferences[key] } },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
    );
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-[#22C55E]">
          Pengaturan notifikasi disimpan.
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Saluran Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(notifData.channels) as ChannelKey[]).map((key) => (
            <div key={key} className="flex items-center justify-between py-1">
              <Label className="cursor-pointer">{channelLabels[key]}</Label>
              <Switch
                checked={notifData.channels[key]}
                onCheckedChange={() => handleChannelToggle(key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Preferensi Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(notifData.preferences) as PrefKey[]).map(
            (key) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="cursor-pointer">{prefLabels[key]}</Label>
                <Switch
                  checked={notifData.preferences[key]}
                  onCheckedChange={() => handlePrefToggle(key)}
                />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const { data: sessions, isLoading: loadingSessions } = useSessionsSettings();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();
  const [totpCode, setTotpCode] = useState("");
  const [qrData, setQrData] = useState<{ secret: string; qr_code_url: string } | null>(null);

  function handleEnable() {
    enable2FA.mutate(undefined, {
      onSuccess: (result) => setQrData(result),
    });
  }

  function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    disable2FA.mutate(totpCode, {
      onSuccess: () => {
        setTotpCode("");
        setQrData(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* 2FA */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#3B82F6]" />
            <CardTitle className="text-base">Two-Factor Authentication (2FA)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!qrData ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748B]">
                Tambahkan lapisan keamanan dengan TOTP authenticator (Google Authenticator,
                Authy, dll).
              </p>
              <Button
                variant="outline"
                onClick={handleEnable}
                disabled={enable2FA.isPending}
                className="ml-4 flex-shrink-0"
              >
                {enable2FA.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Aktifkan 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                <p className="text-sm font-medium text-[#0F172A]">
                  Scan QR code ini dengan aplikasi authenticator Anda:
                </p>
                <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
                  <Key className="h-12 w-12 text-[#94A3B8]" />
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Secret key (backup):</p>
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono text-[#0F172A]">
                    {qrData.secret}
                  </code>
                </div>
              </div>
              <form onSubmit={handleDisable} className="flex gap-2">
                <Input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Masukkan kode TOTP untuk nonaktifkan"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={disable2FA.isPending || !totpCode}
                  className="text-[#EF4444] hover:text-[#EF4444]"
                >
                  {disable2FA.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Nonaktifkan"
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[#3B82F6]" />
            <CardTitle className="text-base">Sesi Aktif</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
            </div>
          ) : (
            <div className="space-y-3">
              {sessions?.map((s) => (
                <div
                  key={s.session_id}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#0F172A]">{s.device}</p>
                      {s.is_current && (
                        <Badge tone="success" className="text-[10px]">
                          Sesi Ini
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {s.ip} · {s.city} · {formatDate(s.last_active_at)}
                    </p>
                  </div>
                  {!s.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#EF4444] hover:text-[#EF4444]"
                    >
                      Logout
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab() {
  const { data, isLoading } = useIntegrationsSettings();

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
      </div>
    );
  }

  const integrations = [
    {
      key: "erp",
      label: "ERP System",
      desc: "Integrasi dengan sistem ERP untuk sinkronisasi data inventory dan order.",
      data: data.erp,
    },
    {
      key: "payment_gateway",
      label: "Payment Gateway",
      desc: "Xendit / Midtrans untuk pemrosesan pembayaran IDR.",
      data: data.payment_gateway,
    },
    {
      key: "logistics",
      label: "Logistics Partner",
      desc: "Integrasi tracking pengiriman dengan mitra logistik.",
      data: data.logistics,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Wallet */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Web3 Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Solana Wallet</p>
              {data.wallet.connected ? (
                <p className="text-xs text-[#64748B]">
                  {data.wallet.address} · {data.wallet.network}
                </p>
              ) : (
                <p className="text-xs text-[#64748B]">Belum terhubung</p>
              )}
            </div>
            <Badge tone={data.wallet.connected ? "success" : "neutral"}>
              {data.wallet.connected ? "Terhubung" : "Tidak Aktif"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Sistem Eksternal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{item.label}</p>
                <p className="text-xs text-[#64748B]">
                  {item.data.connected
                    ? `Provider: ${item.data.provider}`
                    : item.desc}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.data.connected ? "success" : "neutral"}>
                  {item.data.connected ? "Terhubung" : "Tidak Aktif"}
                </Badge>
                {!item.data.connected && (
                  <Button variant="outline" size="sm">
                    Hubungkan
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">API Keys</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Key className="h-3.5 w-3.5" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.api_keys.length === 0 ? (
            <p className="text-sm text-[#64748B]">Belum ada API key.</p>
          ) : (
            data.api_keys.map((k) => (
              <div
                key={k.key_id}
                className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{k.label}</p>
                  <p className="text-xs text-[#64748B]">
                    Dibuat {formatDate(k.created_at)} · Terakhir dipakai{" "}
                    {formatDate(k.last_used_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#EF4444] hover:text-[#EF4444]"
                >
                  Hapus
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <main className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="space-y-3">
          <Badge tone="neutral">Pengaturan</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Settings</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#64748B]">
              Kelola profil, informasi bisnis, notifikasi, keamanan akun, dan integrasi sistem
              Anda.
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:w-52 flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "business" && <BusinessTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
        </div>
      </div>
    </main>
  );
}
