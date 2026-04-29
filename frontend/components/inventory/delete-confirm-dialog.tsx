"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteInventoryItem } from "@/hooks/useInventory";
import type { InventoryItem } from "@/hooks/useInventory";

type Props = {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
};

export function DeleteConfirmDialog({ open, onClose, item }: Props) {
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteInventoryItem();

  async function handleDelete() {
    if (!item) return;
    setError(null);
    try {
      await del.mutateAsync(item.id);
      onClose();
    } catch {
      setError("Gagal menghapus item. Coba lagi.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Hapus Item" description={`Yakin ingin menghapus "${item?.name}"? Aksi ini tidak bisa dibatalkan.`}>
      <div className="space-y-4">
        {item && (
          <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
            <p className="text-sm font-semibold text-[#0F172A]">{item.name}</p>
            <p className="mt-1 text-xs text-[#64748B]">
              Stok: {item.stock} {item.unit} · Kategori: {item.category}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-[#DC2626]">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={del.isPending}>
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            disabled={del.isPending}
            className="gap-2 bg-[#EF4444] hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
            {del.isPending ? "Menghapus..." : "Hapus Item"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
