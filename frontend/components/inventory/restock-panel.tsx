"use client";

import { Sparkles, Star, Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RestockRecommendation } from "@/hooks/useInventory";

const urgencyTone = { high: "danger", medium: "warning", low: "info" } as const;
const urgencyLabel = { high: "Segera restock", medium: "Perhatikan", low: "Aman" } as const;

type Props = {
  recommendation: RestockRecommendation;
  onClose: () => void;
  onCreateOrder: (rec: RestockRecommendation) => void;
};

export function RestockPanel({ recommendation: rec, onClose, onCreateOrder }: Props) {
  return (
    <Card className="rounded-2xl border-blue-100 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_70%)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/80 p-2.5 text-[#2563EB] shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                AI Restock Recommendation
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#0F172A]">{rec.item_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={urgencyTone[rec.urgency]}>{urgencyLabel[rec.urgency]}</Badge>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[#94A3B8] hover:bg-slate-100 hover:text-[#0F172A]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#475569]">{rec.recommendation}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]">
              Suggested qty
            </p>
            <p className="mt-1.5 text-lg font-semibold text-[#0F172A]">
              {rec.suggested_qty} {rec.suggested_unit}
            </p>
          </div>

          {rec.suggested_supplier && (
            <div className="rounded-xl border border-white/80 bg-white/70 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]">
                Suggested supplier
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
                {rec.suggested_supplier.name}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-[#F59E0B]" />
                  {rec.suggested_supplier.reputation_score}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {rec.suggested_supplier.estimated_delivery_days} hari
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          {rec.suggested_supplier && (
            <Button onClick={() => onCreateOrder(rec)} className="gap-2">
              <Truck className="h-4 w-4" />
              Buat Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
