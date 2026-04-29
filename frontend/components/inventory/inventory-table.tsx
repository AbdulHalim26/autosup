"use client";

import { PencilLine, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import type { InventoryItem } from "@/hooks/useInventory";

type Props = {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onRestock: (item: InventoryItem) => void;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function InventoryTable({ items, onEdit, onDelete, onRestock }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b border-[#E2E8F0] pb-4">
        <CardTitle>Inventory Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-left">
                {["Item Name", "Category", "Stock", "Min Stock", "Unit", "Status", "Last Updated", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#0F172A]">{item.name}</p>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">{item.id}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#475569]">{item.category.replace("_", " ")}</td>
                  <td className="px-5 py-4 text-sm font-medium text-[#0F172A]">{item.stock}</td>
                  <td className="px-5 py-4 text-sm text-[#475569]">{item.min_stock}</td>
                  <td className="px-5 py-4 text-sm text-[#475569]">{item.unit}</td>
                  <td className="px-5 py-4">
                    <InventoryStatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-[#475569]">{formatDate(item.last_updated)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestock(item)}
                        title="AI Restock Recommendation"
                        className="rounded-lg border border-[#E2E8F0] p-2 text-[#64748B] transition hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        title="Edit"
                        className="rounded-lg border border-[#E2E8F0] p-2 text-[#64748B] transition hover:bg-slate-50 hover:text-[#0F172A]"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        title="Delete"
                        className="rounded-lg border border-[#E2E8F0] p-2 text-[#64748B] transition hover:border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
