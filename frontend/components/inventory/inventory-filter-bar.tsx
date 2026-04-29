"use client";

import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  search: string;
  category: string;
  status: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onReset: () => void;
};

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "bahan_baku", label: "Bahan baku" },
  { value: "packaging", label: "Packaging" },
  { value: "produk_jadi", label: "Produk jadi" },
  { value: "peralatan", label: "Peralatan" },
  { value: "lainnya", label: "Lainnya" },
];

const STATUSES = [
  { value: "", label: "All status" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

export function InventoryFilterBar({
  search,
  category,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onReset,
}: Props) {
  const hasFilter = search || category || status;

  return (
    <Card className="rounded-2xl">
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            className="pl-10"
            placeholder="Search item name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          className="h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE]"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          className="h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE]"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <Button
          className="gap-2"
          variant="secondary"
          onClick={onReset}
          disabled={!hasFilter}
        >
          <Filter className="h-4 w-4" />
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}
