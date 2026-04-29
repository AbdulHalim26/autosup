# AUTOSUP Frontend — Context File

> **Tujuan file ini:** Continuity antar sesi. Baca ini dulu sebelum mulai coding agar tidak re-explore dari nol.  
> **Update terakhir:** 2026-04-29  
> **Status project:** Dokumen selesai v2.0 · Kode MVP Core 5/14+ fitur  
> **Progress terbaru:** `lib/mocks/orders.ts` ✅ · `hooks/useOrders.ts` ✅ · `orders/page.tsx` ✅ wired — next: order creation dialog

---

## 1. Project Overview

**AUTOSUP** adalah platform supply chain berbasis AI dan trust layer untuk UMKM. Dua role login:
- `distributor` — bisnis yang beli dari supplier, jual ke retailer. Kelola stok, partner, order, kredit, payment, logistik, analytics.
- `supplier` — penyedia barang. Kelola produk, proses incoming order, pantau demand & partner.

**Retailer & logistics partner = entitas yang dikelola distributor, bukan role login.**

**Trust layer** (Partnership NFT Solana + Smart Escrow IDR + On-chain Reputation) dikelola backend, frontend hanya surface hasilnya (badge/status chip).

---

## 2. Source of Truth (urutan prioritas)

1. `frontend/autosup-complete.md` — visi produk, fitur per role (3 roles: supplier, distributor, retailer), design prompts, framing UX
2. `frontend/PRD.md` — scope MVP, acceptance criteria per fitur (Section 3A distributor · 3B supplier · 3C retailer)
3. `api-contract.md` — endpoint, request/response shape, enum status (source of truth untuk data)
4. `frontend/CLAUDE.md` — tech stack, coding rules, implementation guardrails
5. `frontend/AGENTS.md` — workflow agent, stop conditions, handoff rules
6. `frontend/README.md` — developer onboarding, route map, status implementasi

Jika konflik: api-contract menang untuk data · PRD menang untuk scope · autosup-complete menang untuk UX framing.

---

## 3. Tech Stack

| Layer | Tool | Versi |
|-------|------|-------|
| Framework | Next.js App Router | 16.2.4 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | 4 |
| Components | Shadcn/UI + Radix UI | - |
| Icons | lucide-react | ^1.11.0 |
| Server state | @tanstack/react-query | ^5.100.5 |
| Client state | Zustand | ^5.0.12 |
| HTTP | Axios | ^1.15.2 |
| Auth | reCAPTCHA v3 (react-google-recaptcha-v3) | ^1.11.0 |
| Blockchain | @solana/web3.js + @coral-xyz/anchor | (passive, no active flow) |
| Types | TypeScript | ^5 |

**Environment variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
NEXT_PUBLIC_USE_MOCK=true   # toggle mock vs real API
```

---

## 4. State Implementasi Saat Ini

### ✅ Sudah ada dan jalan

| Fitur | Route | Hook | Mock |
|-------|-------|------|------|
| Login | `app/auth/login/` | `useAuth.ts` | - |
| Register | `app/auth/register/` | `useAuth.ts` | - |
| Dashboard | `app/dashboard/dashboard/` | `useDashboard.ts` | `lib/mocks/dashboard.ts` |
| Inventory CRUD + AI restock | `app/dashboard/inventory/` | `useInventory.ts` | `lib/mocks/inventory.ts` |
| Suppliers + Partnership flow | `app/dashboard/suppliers/` | `useSuppliers.ts` | `lib/mocks/suppliers.ts` |
| Orders | `app/dashboard/orders/` | `useOrders.ts` ✅ | `lib/mocks/orders.ts` ✅ |

### ⚠️ Ada UI, belum ada hook/API wiring

- Orders page — UI ada (order-card, filter, progress), tapi data hardcoded, `useOrders.ts` masih kosong.
- AI Restock → Create Order — button prefill sudah ada di restock-panel tapi flow belum tersambung ke order creation.

### ❌ Belum ada (planned Core MVP v2.0)

**Distributor pages:**
- `app/dashboard/retailers/` — Retailer Management
- `app/dashboard/credit/` — Credit Line
- `app/dashboard/payment/` — Payment & Invoice
- `app/dashboard/logistics/` — Logistics Tracking
- `app/dashboard/analytics/` — Analytics
- `app/dashboard/ai-agents/` — AI Agents hub
- `app/dashboard/settings/` — Settings

**Supplier pages:**
- `app/dashboard/demand/` — Demand Intelligence
- `app/dashboard/geo/` — Geo Mapping
- `app/dashboard/distributors/` — Distributor Management
- `app/dashboard/analytics/` — Supplier Analytics
- `app/dashboard/settings/` — Settings

**Missing hooks:** `useOrders.ts`, `useRetailers.ts`, `useCredit.ts`, `usePayments.ts`, `useLogistics.ts`, `useAnalytics.ts`, `useAiAgents.ts`, `useSettings.ts`

**Missing mocks:** ~~`lib/mocks/orders.ts`~~ ✅, `lib/mocks/retailers.ts`, `lib/mocks/credit.ts`, `lib/mocks/payments.ts`, `lib/mocks/logistics.ts`, `lib/mocks/analytics.ts`, `lib/mocks/ai-agents.ts`, `lib/mocks/settings.ts`

---

## 5. Peta File Kritis

### Hooks

| File | Isi | Pattern |
|------|-----|---------|
| `hooks/useAuth.ts` | `useLogin()`, `useRegister()`, `useLogout()` | useState + axios direct (bukan React Query) |
| `hooks/useInventory.ts` | `useInventory(filters)`, `useAddInventoryItem()`, `useUpdateInventoryItem()`, `useDeleteInventoryItem()`, `useRestockRecommendation()` | React Query (useQuery + useMutation) |
| `hooks/useSuppliers.ts` | `useSuppliers(filters)`, `usePartnershipRequests(status)`, `useRequestPartnership()`, `useRespondPartnership()` | React Query |
| `hooks/useDashboard.ts` | `useDashboard()` | React Query, staleTime 60s |
| `hooks/useOrders.ts` | `useOrders()`, `useOrderDetail()`, `useCreateOrder()`, `useUpdateOrderStatus()` | React Query ✅ |

### Store

| File | State |
|------|-------|
| `store/useAuthStore.ts` | `user: AuthUser\|null`, `accessToken`, `refreshToken`, `isAuthenticated`, `setAuth()`, `setAccessToken()`, `clearAuth()` — Zustand + localStorage persist (`autosup-auth`) |

`AuthUser` shape: `{ user_id, full_name, email, role, business_name }`

### Lib

| File | Fungsi |
|------|--------|
| `lib/api.ts` | Axios instance, base URL dari env, request interceptor (Bearer token), response interceptor (auto refresh 401 + retry queue) |
| `lib/utils.ts` | className merge + shared helpers |
| `lib/mocks/dashboard.ts` | `mockDistributorSummary`, `mockSupplierSummary` |
| `lib/mocks/inventory.ts` | Array 5 items + `getMockInventory(filters)` |
| `lib/mocks/suppliers.ts` | Array 5 suppliers + 3 requests + `getMockSuppliers()`, `getMockPartnershipRequests()` |

### Components penting

| Path | Isi |
|------|-----|
| `components/dashboard/dashboard-shell.tsx` | Sidebar nav + layout shell (4 item nav, role label) |
| `components/auth/auth-guard.tsx` | Cek `isAuthenticated` dari store, redirect ke login |
| `components/inventory/restock-panel.tsx` | AI restock recommendation panel + TODO: link to order |
| `components/orders/order-card.tsx` | Order card dengan status badge + progress |
| `components/suppliers/partnership-requests-panel.tsx` | Panel supplier untuk accept/reject requests |

---

## 6. Code Patterns (Harus Diikuti)

### Hook pattern (React Query)

```typescript
// Query
export function useInventory(filters: InventoryFilters) {
  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: async () => {
      if (USE_MOCK) {
        await delay(400);
        return getMockInventory(filters);
      }
      const res = await api.get<ApiResponse<InventoryData>>("/inventory", { params: filters });
      return res.data.data;
    },
    staleTime: 30_000,
  });
}

// Mutation
export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AddItemBody) => {
      const res = await api.post<ApiResponse<InventoryItem>>("/inventory", body);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
```

### ApiResponse type

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error_code?: string;
}
```

### Loading/Error/Empty state pattern (konsisten di semua page)

```typescript
if (isLoading) return <FeatureLoadingState />;
if (isError) return <FeatureErrorState onRetry={() => refetch()} />;
if (!data || data.length === 0) return <FeatureEmptyState />;
return <MainContent />;
```

### Dialog state pattern

```typescript
type DialogState =
  | { type: "closed" }
  | { type: "add" }
  | { type: "edit"; item: Item }
  | { type: "delete"; item: Item };

const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

// Usage
<Dialog open={dialog.type === "add" || dialog.type === "edit"}>
  <ItemFormDialog
    item={dialog.type === "edit" ? dialog.item : undefined}
    onClose={() => setDialog({ type: "closed" })}
  />
</Dialog>
```

### Role check pattern

```typescript
const role = useAuthStore((s) => s.user?.role);
// dalam JSX:
{role === "distributor" && <DistributorOnlyUI />}
{role === "supplier" && <SupplierOnlyUI />}
```

### Error handling (jangan alert())

```typescript
// Toast untuk feedback
import { toast } from "sonner"; // atau library yang dipakai
toast.error("Gagal menyimpan. Coba lagi.");
toast.success("Item berhasil ditambahkan.");

// Inline validation di form
// Status banner untuk halaman-level error
```

### Mock toggle

```typescript
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
if (USE_MOCK) {
  await new Promise(r => setTimeout(r, 400)); // simulasi latency
  return mockData;
}
// real API call...
```

---

## 7. Enum & Types (Fixed, Jangan Diubah)

```typescript
type UserRole = "distributor" | "supplier";

type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

type OrderStatus = "pending" | "processing" | "shipping" | "delivered" | "cancelled";

type EscrowStatus = "held" | "released" | "refunded";

type PartnershipRequestStatus = "pending" | "accepted" | "rejected";

type SupplierType = "partner" | "discover";

type CreditAccountStatus = "active" | "overdue" | "suspended" | "closed";

type PaymentStatus = "pending" | "paid" | "partial" | "failed" | "refunded";

type PaymentDirection = "incoming" | "outgoing";

type ShipmentStatus = "packed" | "dispatched" | "in_transit" | "delivered" | "delayed" | "failed";

type RiskLevel = "low" | "medium" | "high";

type Urgency = "low" | "medium" | "high";

type AiInsightType =
  | "restock_alert"
  | "demand_forecast"
  | "demand_alert"
  | "credit_risk"
  | "logistics_optimization"
  | "supplier_recommendation"
  | "production_recommendation";

type AiAgentName =
  | "demand_forecast"
  | "auto_restock"
  | "credit_risk"
  | "logistics_optimization"
  | "supplier_recommendation";

type AutomationLevel = "manual_approval" | "auto_with_threshold" | "auto_execute";
```

---

## 8. API Endpoint Quick Reference

Base URL: `http://localhost:8000/api/v1`  
Auth header: `Authorization: Bearer <supabase_jwt_token>` (semua kecuali `/auth/*`)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| POST | `/auth/login` | public | email, password, recaptcha_token |
| POST | `/auth/register` | public | full_name, email, password, role, business_name, phone |
| POST | `/auth/refresh` | public | refresh_token |
| POST | `/auth/logout` | auth | refresh_token |
| GET | `/dashboard/summary` | both | role-aware response |
| GET | `/inventory` | both | ?status&category&search&page&limit |
| POST | `/inventory` | both | create item |
| PUT | `/inventory/{id}` | both | update item |
| DELETE | `/inventory/{id}` | both | delete item |
| POST | `/ai/restock-recommendation` | distributor | { item_id } |
| POST | `/ai/demand-forecast` | both | { item_id, forecast_days } |
| POST | `/ai/credit-risk` | distributor | { retailer_id } |
| GET | `/ai/agents` | both | list agent + status |
| PUT | `/ai/agents/{name}/config` | both | update automation level |
| GET | `/ai/agents/recommendations` | both | live recommendation feed |
| GET | `/suppliers` | both | ?type&search&page&limit |
| GET | `/suppliers/{id}/stock` | distributor | partner only (403 if not partner) |
| GET | `/suppliers/partnership-requests` | supplier | ?status&page&limit |
| POST | `/suppliers/partnership-request` | distributor | { supplier_id } |
| PUT | `/suppliers/partnership-request/{id}` | supplier | { action: "accept"\|"reject" } |
| GET | `/orders` | both | ?status&role=buyer\|seller&page&limit |
| POST | `/orders` | distributor | { supplier_id, items[], delivery_address, notes } |
| GET | `/orders/{id}` | both | detail + status_history + escrow_status |
| PUT | `/orders/{id}/status` | supplier | { status } |
| GET | `/retailers` | distributor | ?segment&status&search&page&limit |
| POST | `/retailers` | distributor | create retailer |
| GET | `/retailers/{id}` | distributor | detail + history + credit_summary |
| PUT | `/retailers/{id}` | distributor | update retailer |
| GET | `/credit/accounts` | distributor | ?status&retailer_id&page&limit |
| POST | `/credit/accounts` | distributor | { retailer_id, credit_limit, billing_cycle_days } |
| PUT | `/credit/accounts/{id}` | distributor | adjust limit/status |
| GET | `/credit/accounts/{id}/repayments` | distributor | repayment history |
| GET | `/payments` | both | ?direction&status&from&to&page&limit |
| GET | `/payments/{id}` | both | detail + escrow + history |
| POST | `/payments/settle` | distributor | { order_id } |
| GET | `/invoices` | distributor | ?status&retailer_id&page&limit |
| POST | `/invoices` | distributor | generate invoice |
| GET | `/logistics/shipments` | distributor | ?status&page&limit |
| GET | `/logistics/shipments/{id}` | distributor | detail + timeline + ai recommendation |
| PUT | `/logistics/shipments/{id}/route` | distributor | { carrier_id, apply_ai_recommendation } |
| GET | `/logistics/partners` | distributor | list carrier + reliability |
| GET | `/analytics/distributor/overview` | distributor | ?period&from&to |
| GET | `/analytics/distributor/regional` | distributor | - |
| GET | `/analytics/supplier/overview` | supplier | ?period&from&to |
| GET | `/analytics/supplier/regional` | supplier | - |
| GET | `/analytics/products/insights` | both | top/declining/stock-risk |
| GET | `/settings/profile` | both | - |
| PUT | `/settings/profile` | both | partial update |
| GET | `/settings/business` | both | role-aware fields |
| PUT | `/settings/business` | both | partial update |
| GET | `/settings/notifications` | both | - |
| PUT | `/settings/notifications` | both | partial update |
| GET | `/settings/integrations` | both | ERP, payment, wallet, logistics, API keys |
| PUT | `/settings/integrations/{type}` | both | type: erp\|payment_gateway\|wallet\|logistics |
| POST | `/settings/security/2fa/enable` | both | returns secret + qr_code_url |
| POST | `/settings/security/2fa/disable` | both | { totp_code } |
| GET | `/settings/security/sessions` | both | active login sessions |
| GET | `/blockchain/escrow/{order_id}` | both | escrow status detail |
| GET | `/blockchain/partnership-nft/{dist_id}/{sup_id}` | both | NFT metadata |
| GET | `/blockchain/reputation/{wallet}` | both | on-chain reputation score |

---

## 9. Gap List (Prioritas Implementasi)

Urut berdasarkan blocker impact:

### P0 — Blocker untuk banyak fitur lain

1. **`hooks/useOrders.ts`** + **`lib/mocks/orders.ts`** — Order list, detail, create, status update. Semua page lain (payment, logistics, AI restock flow) depend on orders.
2. **Order creation form** (`components/orders/order-form-dialog.tsx`) — Form: pilih supplier partner, items[], qty, price_per_unit, delivery_address, notes.
3. **AI Restock → Create Order linkage** — Di `restock-panel.tsx` ada TODO: prefill order form dari recommendation (suggested_supplier, suggested_qty).

### P1 — Core experience, berdiri sendiri

4. **Orders page** — Wire ke `useOrders.ts`, ganti hardcoded static data, tambah filter + status update action (untuk supplier).
5. **Dashboard distributor expand** — Tambah Inventory Intelligence Hub, Distribution Flow Monitor, Demand Forecast chart, Supplier Network Snapshot (sesuai `autosup-complete.md §9 Distributor Dashboard prompt`).
6. **Dashboard supplier expand** — Tambah Demand Trend chart, Top Products card, Distributor Activity feed (sesuai `autosup-complete.md §9 Supplier Dashboard prompt`).
7. **Sidebar nav update** — Tambah link ke semua halaman baru + role gating (distributor-only vs supplier-only vs shared).

### P2 — Fitur mandiri distributor

8. Retailer Management page + hook + mock
9. Credit Line page + hook + mock
10. Payment page + hook + mock
11. Settings page + hook + mock

### P3 — Fitur mandiri supplier

12. Demand Intelligence page + hook + mock
13. Geo Mapping Demand page + hook
14. Distributor Management page (mirror suppliers page) + hook

### P4 — Advanced features

15. Logistics page + hook + mock
16. Analytics pages (distributor + supplier) + hook + mock
17. AI Agents hub page + hook + mock
18. Blockchain trust layer dedicated UI (escrow detail, NFT detail card, blockchain verification)

---

## 10. Implementasi Berikutnya — Step by Step

### Step 1: `lib/mocks/orders.ts`

Shape mengikuti `api-contract.md` Section 5:
```typescript
// Orders array dengan status variety: pending, processing, shipping, delivered
// buyer/seller fields, items[], total_amount, escrow_status, status_history
// Fungsi: getMockOrders(filters), getMockOrderDetail(id)
```

### Step 2: `hooks/useOrders.ts`

```typescript
export function useOrders(filters: OrderFilters)          // GET /orders
export function useOrderDetail(orderId: string)           // GET /orders/{id}
export function useCreateOrder()                          // POST /orders
export function useUpdateOrderStatus()                    // PUT /orders/{id}/status
```

### Step 3: Wire `app/dashboard/orders/page.tsx`

Ganti hardcoded array dengan `useOrders()`. Tambah:
- Role check: distributor lihat orders sebagai buyer (dengan tombol "Create Order"), supplier lihat sebagai seller (dengan tombol "Update Status").
- Create order dialog (pakai pattern dialog yang sudah ada).
- Filter bar yang sudah ada (`orders-filter-bar.tsx`) disambungkan ke state.

### Step 4: AI Restock → Order linkage

Di `components/inventory/restock-panel.tsx`:
```typescript
// Button "Buat Order Sekarang" harus:
// 1. Close restock panel
// 2. Navigate ke /dashboard/orders dengan query params
//    atau open create order dialog dengan prefilled data
```

### Step 5: Sidebar update

Di `components/dashboard/dashboard-shell.tsx`, tambah nav items dengan role gating:
- Distributor only: Retailers, Credit, Payment, Logistics, Analytics, AI Agents
- Supplier only: Demand Intelligence, Geo Mapping, Distributors (Distributor Management)
- Shared: Settings

---

## 11. Contoh Membuat Halaman Baru (Template)

Untuk setiap halaman baru, ikuti urutan:

1. Buat `lib/mocks/<feature>.ts` — data shape ikut api-contract.md
2. Buat `hooks/use<Feature>.ts` — React Query dengan mock fallback
3. Buat components di `components/<feature>/`:
   - `<feature>-loading-state.tsx`
   - `<feature>-empty-state.tsx`
   - `<feature>-error-state.tsx`
   - Komponen utama (table, card, panel)
4. Buat `app/dashboard/<feature>/page.tsx` — gunakan hook, handle 4 states
5. Tambah link di sidebar `dashboard-shell.tsx` dengan role gate

Contoh dari inventory yang sudah ada:
- `lib/mocks/inventory.ts` ✅
- `hooks/useInventory.ts` ✅
- `components/inventory/*` ✅ (6+ components)
- `app/dashboard/inventory/page.tsx` ✅

---

## 12. Non-Goals (Jangan Implementasikan)

- Auto-execute action terminal tanpa konfirmasi user (create order, settle payment, approve credit)
- Wallet-native flow (mint manual, transfer, swap oleh user)
- Multi-currency selain IDR
- Multi-warehouse advanced allocation algorithm
- Native mobile app
- `alert()` untuk error handling
- Fetch langsung di komponen (harus lewat hook)
- Endpoint baru di api-contract tanpa instruksi eksplisit
