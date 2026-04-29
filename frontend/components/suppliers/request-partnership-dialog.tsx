"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { LegacyDialog as Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRequestPartnership, type Supplier } from "@/hooks/useSuppliers";

type Props = {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
};

export function RequestPartnershipDialog({ open, onClose, supplier }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const request = useRequestPartnership();

  async function handleConfirm() {
    if (!supplier) return;
    setError(null);
    try {
      await request.mutateAsync(supplier.supplier_id);
      setSuccess(true);
    } catch {
      setError("Gagal mengirim permintaan. Coba lagi.");
    }
  }

  function handleClose() {
    setError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={success ? "Permintaan Terkirim" : "Request Partnership"}
      description={
        success
          ? "Permintaan kemitraan berhasil dikirim. Tunggu konfirmasi dari supplier."
          : `Kirim permintaan kemitraan ke ${supplier?.name}? Backend akan memproses Partnership NFT setelah supplier menyetujui.`
      }
    >
      {!success && supplier && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{supplier.name}</p>
                <p className="text-xs text-[#64748B]">
                  {supplier.category.replace("_", " ")} · Reputation {supplier.reputation_score}
                </p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-[#DC2626]">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={request.isPending}>
              Batal
            </Button>
            <Button onClick={handleConfirm} disabled={request.isPending} className="gap-2">
              {request.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {request.isPending ? "Mengirim..." : "Kirim Permintaan"}
            </Button>
          </div>
        </div>
      )}

      {success && (
        <div className="flex justify-end">
          <Button onClick={handleClose}>Tutup</Button>
        </div>
      )}
    </Dialog>
  );
}
