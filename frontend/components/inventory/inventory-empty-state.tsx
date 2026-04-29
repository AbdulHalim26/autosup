import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = { onAdd?: () => void };

export function InventoryEmptyState({ onAdd }: Props) {
  return (
    <Card className="rounded-2xl border-dashed">
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
          <Boxes className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-[#0F172A]">
          Belum ada item inventory
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#64748B]">
          Mulai bangun visibilitas supply chain dengan menambahkan item pertama agar stok, threshold, dan rekomendasi restock bisa dipantau dari dashboard.
        </p>
        <Button className="mt-6" onClick={onAdd}>Add Item</Button>
      </CardContent>
    </Card>
  );
}
