import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = { onRetry?: () => void };

export function InventoryErrorState({ onRetry }: Props) {
  return (
    <Card className="rounded-2xl border-rose-200 bg-rose-50/50">
      <CardContent className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2 text-[#EF4444]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              Gagal memuat inventory
            </p>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              Terjadi kesalahan saat mengambil data. Coba lagi atau hubungi tim jika masalah berlanjut.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={onRetry}>Try Again</Button>
      </CardContent>
    </Card>
  );
}
