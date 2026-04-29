import type { Order, OrderDetail, OrderStatus, OrdersResponse } from "@/hooks/useOrders";

export const mockOrders: OrderDetail[] = [
  {
    order_id: "order-uuid-001",
    order_number: "ORD-2026-001",
    buyer: { id: "user-uuid-dist-001", name: "Toko Budi Jaya", role: "distributor" },
    seller: { id: "supplier-uuid-001", name: "CV Maju Bersama", role: "supplier" },
    items: [
      { item_name: "Tepung Terigu", qty: 100, unit: "kg", price_per_unit: 12000, subtotal: 1200000 },
    ],
    total_amount: 1200000,
    status: "processing",
    escrow_status: "held",
    delivery_address: "Jl. Merdeka No.10, Jakarta Pusat",
    notes: "Tolong dibungkus rapi",
    estimated_delivery: "2026-05-02",
    status_history: [
      { status: "pending", changed_at: "2026-04-28T09:00:00Z" },
      { status: "processing", changed_at: "2026-04-28T11:30:00Z" },
    ],
    created_at: "2026-04-28T09:00:00Z",
    updated_at: "2026-04-28T11:30:00Z",
  },
  {
    order_id: "order-uuid-002",
    order_number: "ORD-2026-002",
    buyer: { id: "user-uuid-dist-001", name: "Toko Budi Jaya", role: "distributor" },
    seller: { id: "supplier-uuid-003", name: "Nusantara Supply Co.", role: "supplier" },
    items: [
      { item_name: "Cup Packaging 16oz", qty: 500, unit: "pcs", price_per_unit: 800, subtotal: 400000 },
      { item_name: "Sedotan Kertas", qty: 1000, unit: "pcs", price_per_unit: 150, subtotal: 150000 },
    ],
    total_amount: 550000,
    status: "shipping",
    escrow_status: "held",
    delivery_address: "Jl. Sudirman No.5, Jakarta Selatan",
    notes: null,
    estimated_delivery: "2026-05-01",
    status_history: [
      { status: "pending", changed_at: "2026-04-27T08:00:00Z" },
      { status: "processing", changed_at: "2026-04-27T14:00:00Z" },
      { status: "shipping", changed_at: "2026-04-28T07:00:00Z" },
    ],
    created_at: "2026-04-27T08:00:00Z",
    updated_at: "2026-04-28T07:00:00Z",
  },
  {
    order_id: "order-uuid-003",
    order_number: "ORD-2026-003",
    buyer: { id: "user-uuid-dist-001", name: "Toko Budi Jaya", role: "distributor" },
    seller: { id: "supplier-uuid-001", name: "CV Maju Bersama", role: "supplier" },
    items: [
      { item_name: "Gula Pasir", qty: 50, unit: "kg", price_per_unit: 15000, subtotal: 750000 },
      { item_name: "Minyak Goreng", qty: 20, unit: "liter", price_per_unit: 18000, subtotal: 360000 },
    ],
    total_amount: 1110000,
    status: "delivered",
    escrow_status: "released",
    delivery_address: "Jl. Merdeka No.10, Jakarta Pusat",
    notes: "Urgent, stok habis",
    estimated_delivery: "2026-04-25",
    status_history: [
      { status: "pending", changed_at: "2026-04-22T10:00:00Z" },
      { status: "processing", changed_at: "2026-04-22T13:00:00Z" },
      { status: "shipping", changed_at: "2026-04-23T08:00:00Z" },
      { status: "delivered", changed_at: "2026-04-25T14:00:00Z" },
    ],
    created_at: "2026-04-22T10:00:00Z",
    updated_at: "2026-04-25T14:00:00Z",
  },
  {
    order_id: "order-uuid-004",
    order_number: "ORD-2026-004",
    buyer: { id: "user-uuid-dist-002", name: "Warung Sumber Rejeki", role: "distributor" },
    seller: { id: "supplier-uuid-001", name: "CV Maju Bersama", role: "supplier" },
    items: [
      { item_name: "Brown Sugar Syrup", qty: 24, unit: "bottle", price_per_unit: 35000, subtotal: 840000 },
    ],
    total_amount: 840000,
    status: "pending",
    escrow_status: "held",
    delivery_address: "Jl. Gatot Subroto No.88, Jakarta",
    notes: null,
    estimated_delivery: "2026-05-03",
    status_history: [
      { status: "pending", changed_at: "2026-04-29T08:00:00Z" },
    ],
    created_at: "2026-04-29T08:00:00Z",
    updated_at: "2026-04-29T08:00:00Z",
  },
  {
    order_id: "order-uuid-005",
    order_number: "ORD-2026-005",
    buyer: { id: "user-uuid-dist-001", name: "Toko Budi Jaya", role: "distributor" },
    seller: { id: "supplier-uuid-003", name: "Nusantara Supply Co.", role: "supplier" },
    items: [
      { item_name: "Kotak Dus 30x30", qty: 200, unit: "pcs", price_per_unit: 2500, subtotal: 500000 },
    ],
    total_amount: 500000,
    status: "cancelled",
    escrow_status: "refunded",
    delivery_address: "Jl. Sudirman No.5, Jakarta Selatan",
    notes: "Dibatalkan karena ketersediaan stok supplier habis",
    estimated_delivery: "2026-04-30",
    status_history: [
      { status: "pending", changed_at: "2026-04-26T09:00:00Z" },
      { status: "cancelled", changed_at: "2026-04-26T15:00:00Z" },
    ],
    created_at: "2026-04-26T09:00:00Z",
    updated_at: "2026-04-26T15:00:00Z",
  },
  {
    order_id: "order-uuid-006",
    order_number: "ORD-2026-006",
    buyer: { id: "user-uuid-dist-002", name: "Warung Sumber Rejeki", role: "distributor" },
    seller: { id: "supplier-uuid-001", name: "CV Maju Bersama", role: "supplier" },
    items: [
      { item_name: "Tepung Terigu", qty: 200, unit: "kg", price_per_unit: 12000, subtotal: 2400000 },
      { item_name: "Gula Pasir", qty: 100, unit: "kg", price_per_unit: 15000, subtotal: 1500000 },
    ],
    total_amount: 3900000,
    status: "delivered",
    escrow_status: "released",
    delivery_address: "Jl. Gatot Subroto No.88, Jakarta",
    notes: null,
    estimated_delivery: "2026-04-20",
    status_history: [
      { status: "pending", changed_at: "2026-04-17T07:00:00Z" },
      { status: "processing", changed_at: "2026-04-17T10:00:00Z" },
      { status: "shipping", changed_at: "2026-04-18T08:00:00Z" },
      { status: "delivered", changed_at: "2026-04-20T13:00:00Z" },
    ],
    created_at: "2026-04-17T07:00:00Z",
    updated_at: "2026-04-20T13:00:00Z",
  },
];

export function getMockOrders(params: {
  status?: OrderStatus;
  role?: "buyer" | "seller";
  search?: string;
  page?: number;
  limit?: number;
}): OrdersResponse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let orders: Order[] = mockOrders.map(({ status_history: _sh, notes: _n, ...order }) => order);

  if (params.status) {
    orders = orders.filter((o) => o.status === params.status);
  }

  const limit = params.limit ?? 20;
  const page = params.page ?? 1;
  const total = orders.length;
  const start = (page - 1) * limit;
  orders = orders.slice(start, start + limit);

  const summary = {
    total_orders: mockOrders.length,
    active_orders: mockOrders.filter((o) =>
      ["pending", "processing", "shipping"].includes(o.status)
    ).length,
    pending_orders: mockOrders.filter((o) => o.status === "pending").length,
    shipping_orders: mockOrders.filter((o) => o.status === "shipping").length,
    delivered_this_month: mockOrders.filter((o) => o.status === "delivered").length,
  };

  return { orders, summary, pagination: { page, limit, total } };
}

export function getMockOrderDetail(orderId: string): OrderDetail | null {
  return mockOrders.find((o) => o.order_id === orderId) ?? null;
}
