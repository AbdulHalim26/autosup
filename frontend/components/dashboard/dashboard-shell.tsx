"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Boxes,
  CreditCard,
  Handshake,
  LayoutDashboard,
  LineChart,
  LogOut,
  Map,
  PackageSearch,
  Settings,
  Sparkles,
  TrendingUp,
  TruckIcon,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, type UserRole } from "@/store/useAuthStore";
import { useLogout } from "@/hooks/useAuth";

function getNavigation(role?: UserRole) {
  const base = [
    { href: "/dashboard/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
    { href: "/dashboard/orders", label: "Orders", icon: PackageSearch },
  ];

  if (role === "distributor") {
    return [
      ...base,
      { href: "/dashboard/suppliers", label: "Suppliers", icon: BarChart3 },
      { href: "/dashboard/partnerships", label: "Partnerships", icon: Handshake },
      { href: "/dashboard/retailers", label: "Retailers", icon: Users },
      { href: "/dashboard/credit", label: "Credit Line", icon: CreditCard },
      { href: "/dashboard/payment", label: "Payment", icon: Wallet },
      { href: "/dashboard/logistics", label: "Logistics", icon: TruckIcon },
      { href: "/dashboard/ai-agents", label: "AI Agents", icon: Bot },
      { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
  }

  if (role === "retailer") {
    return [
      ...base,
      { href: "/dashboard/suppliers", label: "Vendors", icon: BarChart3 },
      { href: "/dashboard/payment", label: "Payment", icon: Wallet },
      { href: "/dashboard/ai-agents", label: "AI Agents", icon: Bot },
      { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
  }

  // supplier
  return [
    ...base,
    { href: "/dashboard/suppliers", label: "Distributors", icon: BarChart3 },
    { href: "/dashboard/demand", label: "Demand Intel", icon: TrendingUp },
    { href: "/dashboard/geo", label: "Geo Mapping", icon: Map },
    { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { logout } = useLogout();

  const workspaceLabel =
    user?.role === "supplier"
      ? "Supplier Workspace"
      : user?.role === "retailer"
        ? "Retailer Workspace"
        : "Distributor Workspace";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6 lg:flex">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F172A] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#64748B]">
                AUTOSUP
              </p>
              <p className="text-sm font-semibold text-[#0F172A]">{workspaceLabel}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-8 space-y-1">
            {getNavigation(user?.role).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          {user && (
            <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#0F172A]">{user.business_name}</p>
              <p className="mt-0.5 text-xs text-[#64748B]">{user.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-[#DBEAFE] px-2 py-0.5 text-xs font-medium text-[#2563EB] capitalize">
                {user.role}
              </span>
            </div>
          )}

          {/* Logout */}
          <div className="mt-auto">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#64748B] transition hover:bg-red-50 hover:text-[#EF4444]"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
