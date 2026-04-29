"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { LegacyDialog as Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateOrder, type CreateOrderPayload } from "@/hooks/useOrders";
import { useSuppliers } from "@/hooks/useSuppliers";

const UNITS = ["kg", "liter", "pcs", "bottle", "box", "karung", "dus"];

type OrderItem = {
  item_name: string;
  qty: number;
  unit: string;
  price_per_unit: number;
};

const emptyItem = (): OrderItem => ({
  item_name: "",
  qty: 1,
  unit: "kg",
  price_per_unit: 0,
});

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrderFormDialog({ open, onClose }: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateOrder();
  const isLoading = create.isPending;

  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ type: "partner" });
  const partners = suppliersData?.suppliers ?? [];

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setSupplierId("");
      setItems([emptyItem()]);
      setDeliveryAddress("");
      setNotes("");
      setError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  function updateItem<K extends keyof OrderItem>(index: number, key: K, value: OrderItem[K]) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.price_per_unit, 0);

  const isFormValid =
    !!supplierId &&
    !!deliveryAddress.trim() &&
    items.length > 0 &&
    items.every((item) => item.item_name.trim() && item.qty > 0 && item.price_per_unit > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: CreateOrderPayload = {
      supplier_id: supplierId,
      items: items.map(({ item_name, qty, unit, price_per_unit }) => ({
        item_name,
        qty,
        unit,
        price_per_unit,
      })),
      delivery_address: deliveryAddress.trim(),
      notes: notes.trim() || undefined,
    };
    try {
      await create.mutateAsync(payload);
      onClose();
    } catch {
      setError("Gagal membuat order. Coba lagi.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Buat Order Baru"
      description="Pilih supplier partner dan isi detail item yang ingin dipesan."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Supplier */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#0F172A]">Supplier partner</label>
          <select
            className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] disabled:opacity-50"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            disabled={isLoading || suppliersLoading}
            required
          >
            <option value="">
              {suppliersLoading ? "Memuat supplier..." : "Pilih supplier"}
            </option>
            {partners.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.name}
              </option>
            ))}
          </select>
          {!suppliersLoading && partners.length === 0 && (
            <p className="text-xs text-[#64748B]">
              Belum ada supplier partner. Tambahkan partner di halaman Suppliers terlebih dahulu.
            </p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#0F172A]">Item yang dipesan</label>
            <Button
              type="button"
              variant="secondary"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={addItem}
              disabled={isLoading}
            >
              <Plus className="h-3 w-3" />
              Tambah item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B] uppercase tracking-[0.15em]">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={isLoading}
                      className="text-[#EF4444] hover:text-red-700 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Nama item (cth: Tepung Terigu)"
                  value={item.item_name}
                  onChange={(e) => updateItem(index, "item_name", e.target.value)}
                  required
                  disabled={isLoading}
                />

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-[#64748B]">Qty</label>
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#64748B]">Unit</label>
                    <select
                      className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE]"
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                      disabled={isLoading}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#64748B]">Harga/unit (IDR)</label>
                    <Input
                      type="number"
                      min={0}
                      value={item.price_per_unit}
                      onChange={(e) => updateItem(index, "price_per_unit", Number(e.target.value))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="text-right text-sm text-[#64748B]">
                  Subtotal:{" "}
                  <span className="font-semibold text-[#0F172A]">
                    {formatCurrency(item.qty * item.price_per_unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end rounded-xl bg-[#F0F9FF] px-4 py-3">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-[#64748B]">Total Amount</p>
              <p className="mt-1 text-xl font-semibold text-[#0F172A]">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#0F172A]">Alamat pengiriman</label>
          <Input
            placeholder="Jl. Merdeka No.10, Jakarta Pusat"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#0F172A]">
            Catatan{" "}
            <span className="font-normal text-[#94A3B8]">(opsional)</span>
          </label>
          <textarea
            className="min-h-[80px] w-full resize-none rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] disabled:opacity-50"
            placeholder="Tolong dikemas rapi, urgent, dll."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
          />
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
          <Button type="submit" disabled={isLoading || !isFormValid}>
            {isLoading ? "Membuat order..." : "Buat Order"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
