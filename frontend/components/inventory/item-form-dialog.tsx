"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { LegacyDialog as Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddInventoryItem, useUpdateInventoryItem } from "@/hooks/useInventory";
import type { InventoryItem, AddItemPayload } from "@/hooks/useInventory";

type Props = {
  open: boolean;
  onClose: () => void;
  editItem?: InventoryItem | null;
};

const UNITS = ["kg", "liter", "pcs", "bottle", "box", "karung", "dus"];
const CATEGORIES = ["bahan_baku", "packaging", "produk_jadi", "peralatan", "lainnya"];

const emptyForm = (): AddItemPayload => ({
  name: "",
  category: "bahan_baku",
  stock: 0,
  min_stock: 0,
  unit: "kg",
});

export function ItemFormDialog({ open, onClose, editItem }: Props) {
  const [form, setForm] = useState<AddItemPayload>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const add = useAddInventoryItem();
  const update = useUpdateInventoryItem();
  const isLoading = add.isPending || update.isPending;

  // Reset form setiap kali dialog dibuka — pakai key reset di parent lebih ideal,
  // tapi ini dihandle dengan startTransition agar tidak menyebabkan cascading render.
  useEffect(() => {
    if (!open) return;
    const next = editItem
      ? { name: editItem.name, category: editItem.category, stock: editItem.stock, min_stock: editItem.min_stock, unit: editItem.unit }
      : emptyForm();
    // schedule setelah paint agar tidak trigger cascading render dalam effect body
    const t = setTimeout(() => { setForm(next); setError(null); }, 0);
    return () => clearTimeout(t);
  }, [open, editItem]);

  function set<K extends keyof AddItemPayload>(key: K, value: AddItemPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editItem) {
        await update.mutateAsync({ id: editItem.id, payload: form });
      } else {
        await add.mutateAsync(form);
      }
      onClose();
    } catch {
      setError("Gagal menyimpan item. Coba lagi.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editItem ? "Edit Item" : "Tambah Item Baru"}
      description={editItem ? "Ubah detail stok atau info item." : "Isi detail item yang ingin ditambahkan ke inventory."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#0F172A]">Nama item</label>
          <Input
            placeholder="Tepung Terigu"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0F172A]">Kategori</label>
            <select
              className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE]"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              disabled={isLoading}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0F172A]">Unit</label>
            <select
              className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE]"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              disabled={isLoading}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0F172A]">Stok saat ini</label>
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0F172A]">Minimum stok</label>
            <Input
              type="number"
              min={0}
              value={form.min_stock}
              onChange={(e) => set("min_stock", Number(e.target.value))}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-sm text-[#DC2626]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading || !form.name}>
            {isLoading ? "Menyimpan..." : editItem ? "Simpan Perubahan" : "Tambah Item"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
