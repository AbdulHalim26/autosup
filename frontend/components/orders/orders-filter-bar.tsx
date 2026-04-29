import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OrderStatus } from "@/hooks/useOrders";

interface OrdersFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: OrderStatus | "";
  onStatusChange: (v: OrderStatus | "") => void;
}

export function OrdersFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: OrdersFilterBarProps) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[1.35fr_0.8fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            className="pl-10"
            placeholder="Search order number or partner..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as OrderStatus | "")}
          className="h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE]"
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipping">Shipping</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </CardContent>
    </Card>
  );
}
