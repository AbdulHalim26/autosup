# AUTOSUP Frontend

Frontend AUTOSUP adalah dashboard operasional untuk **3 role utama** (3-tier supply chain): `supplier`, `distributor`, dan `retailer`. Aplikasi ini dibangun sebagai App Router project di atas Next.js dan menjadi permukaan utama untuk authentication, monitoring stok, supplier partnership, order tracking, payment, AI-assisted automation, dan analytics.

Dokumen ini ditujukan untuk developer internal. Fokusnya adalah cara menjalankan project, memahami struktur frontend, dan tahu dokumen mana yang menjadi acuan implementasi. Project masih berada di fase awal — dokumen sudah lengkap untuk 3 role end-to-end, tapi implementasi kode masih fokus di subset distributor & supplier (5 fitur Core); retailer-as-login completely unimplemented.

## Core MVP

Sejak v3.0, scope Core MVP disamakan dengan `frontend/autosup-complete.md` dan retailer naik jadi role login penuh. Detail acceptance criteria per fitur ada di `frontend/PRD.md` Section 3A (distributor), 3B (supplier), dan 3C (retailer).

**Distributor (15 fitur):**
- authentication & role-based access
- dashboard monitoring
- inventory management
- supplier stock visibility
- suppliers (discovery & procurement)
- partnership management (BARU — page tersendiri di v3.0)
- orders & tracking
- retailer management (CRM — manage retailer clients)
- credit line management
- payment & invoice
- logistics tracking
- analytics
- AI agents (overarching automation)
- settings

**Supplier (8 fitur):**
- authentication & role-based access
- dashboard monitoring
- inventory / products
- demand intelligence
- geo mapping demand
- distributor management (mirror partnership)
- orders incoming
- analytics
- settings

**Retailer (9 fitur — BARU di v3.0):**
- authentication & role-based access
- dashboard monitoring
- inventory management
- orders (purchase to vendor: distributor/supplier)
- suppliers / vendors discovery
- partnership management
- payments (outgoing + credit usage + AI cash flow)
- AI agents (subset: auto-restock, demand forecast, supplier recommendation, price optimization, cash flow optimizer)
- analytics
- settings

Role dan enum yang harus dianggap fixed (full list di `PRD.md` Section 2 dan `api-contract.md`):
- role login: `supplier`, `distributor`, `retailer` (logistics partner = entitas distributor-managed, bukan role login)
- inventory status: `in_stock`, `low_stock`, `out_of_stock`
- order status: `pending`, `processing`, `shipping`, `delivered`, `cancelled`
- escrow status: `held`, `released`, `refunded`
- credit account status: `active`, `overdue`, `suspended`, `closed`
- payment status: `pending`, `paid`, `partial`, `failed`, `refunded`
- shipment status: `packed`, `dispatched`, `in_transit`, `delivered`, `delayed`, `failed`
- AI agent name: `demand_forecast`, `auto_restock`, `credit_risk`, `logistics_optimization`, `supplier_recommendation`, `price_optimization` (retailer), `cash_flow_optimizer` (retailer)

## Tech Stack

- Next.js `16.2.4` dengan App Router
- React `19`
- Tailwind CSS `4`
- Shadcn/UI dan Radix UI
- Zustand
- React Query
- Axios
- Google reCAPTCHA v3

Backend yang menjadi pasangan frontend ini:
- FastAPI untuk API layer
- Supabase untuk auth dan database
- Google Gemini API untuk AI use cases

## Quick Start

Jalankan dari folder `frontend/`.

```bash
npm install
npm run dev
```

Frontend lokal akan jalan di:

```text
http://localhost:3000
```

Command lain yang perlu dipakai saat development:

```bash
npm run lint
npm run build
npm run start
```

Panduan penggunaan command:
- `npm run dev`: jalankan local dev server
- `npm run lint`: cek linting project
- `npm run build`: verifikasi build App Router
- `npm run start`: jalankan hasil production build

## Konfigurasi Environment

Frontend membutuhkan file `.env.local` untuk konfigurasi lokal.

Variable yang sudah diketahui dari dokumen saat ini:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Catatan:
- Login flow mengharuskan `recaptcha_token`, jadi reCAPTCHA v3 perlu disiapkan untuk environment lokal yang dipakai.
- Base API development saat ini mengacu ke `api-contract.md`:

```text
http://localhost:8000/api/v1
```

- Jangan memperkenalkan env contract baru tanpa keputusan eksplisit dari tim atau tanpa update di dokumen source of truth.

## Struktur Folder

Struktur utama frontend saat ini:

```text
frontend/
  app/
  components/
  hooks/
  lib/
  public/
  store/
  AGENTS.md
  CLAUDE.md
  PRD.md
  autosup-complete.md
```

Fungsi folder:
- `app/`: route App Router dan layout halaman
- `components/`: reusable UI components
- `hooks/`: data hooks dan feature hooks
- `lib/`: API helper, utilities, constants, shared helpers
- `public/`: static assets
- `store/`: Zustand stores untuk global state

## Route dan Feature Surface

### Sudah ada di repo
- `app/auth/login/page.tsx`, `app/auth/register/page.tsx` — auth flow lengkap
- `app/dashboard/layout.tsx` — shell + auth guard
- `app/dashboard/dashboard/page.tsx` — dashboard role-aware (KPI + AI insights)
- `app/dashboard/inventory/page.tsx` — CRUD + filter + AI restock panel
- `app/dashboard/orders/page.tsx` — UI selesai, hooks belum disambung (mock-only)
- `app/dashboard/suppliers/page.tsx` — list partner/discover + partnership request flow

### Planned (belum ada, masuk Core MVP v3.0)

**Shared distributor + retailer:**
- `app/dashboard/partnership/` — BARU di v3.0, halaman dedicated terpisah dari `suppliers/`

**Distributor only:**
- `app/dashboard/retailers/` — CRM untuk manage retailer clients
- `app/dashboard/credit/`
- `app/dashboard/payment/` — incoming + outgoing
- `app/dashboard/logistics/`
- `app/dashboard/analytics/`
- `app/dashboard/ai-agents/`
- `app/dashboard/settings/`

**Supplier:**
- `app/dashboard/demand/` — Demand Intelligence
- `app/dashboard/geo/` — Geo Mapping
- `app/dashboard/distributors/` — mirror Suppliers untuk supplier
- `app/dashboard/analytics/` — supplier-side analytics
- `app/dashboard/settings/`

**Retailer (semua belum ada — completely unimplemented):**
- `app/dashboard/dashboard/` — retailer-aware dengan KPI khusus retailer (Total Inventory, Active Orders, Monthly Spending, Supplier Reliability, Forecast Accuracy)
- `app/dashboard/inventory/` — retailer internal stock
- `app/dashboard/orders/` — purchase order ke vendor
- `app/dashboard/suppliers/` — vendor discovery & list
- `app/dashboard/partnership/` — kelola partnership ke vendor
- `app/dashboard/payment/` — outgoing payment + credit usage
- `app/dashboard/ai-agents/` — subset agents (auto-restock, demand forecast, supplier rec, price opt, cash flow)
- `app/dashboard/analytics/` — retailer business analytics
- `app/dashboard/settings/` — termasuk billing, team, compliance fields

> **Catatan implementasi:** banyak route di atas reuse path yang sama lintas role (mis. `inventory/`, `orders/`, `suppliers/`, `payment/`, `analytics/`, `settings/`, `ai-agents/`). Page perlu role-aware via `useAuthStore` + auth context BE; sidebar nav juga role-aware (config berbeda per role).

### Hooks dan helper

Sudah ada:
- `hooks/useAuth.ts`, `hooks/useDashboard.ts`, `hooks/useInventory.ts`, `hooks/useSuppliers.ts`
- `hooks/useOrders.ts` (file masih kosong)
- `store/useAuthStore.ts` (Zustand, persistent)
- `lib/api.ts` (Axios instance + auto-refresh)
- `lib/mocks/dashboard.ts`, `lib/mocks/inventory.ts`, `lib/mocks/suppliers.ts`

Planned:
- `hooks/useRetailers.ts` (distributor CRM), `useCredit.ts`, `usePayments.ts`, `useLogistics.ts`, `useAnalytics.ts`, `useAiAgents.ts`, `useSettings.ts`, `usePartnership.ts`
- `lib/mocks/orders.ts`, `lib/mocks/retailers.ts`, `lib/mocks/credit.ts`, `lib/mocks/payments.ts`, `lib/mocks/logistics.ts`, `lib/mocks/analytics.ts`, `lib/mocks/ai-agents.ts`, `lib/mocks/settings.ts`, `lib/mocks/partnership.ts`
- `store/useAuthStore.ts` perlu extend `user.role` untuk include `retailer`

### Status implementasi

- **Dokumen** (autosup-complete.md, PRD.md, api-contract.md, CLAUDE.md, AGENTS.md) sudah lengkap end-to-end untuk 3 role (distributor, supplier, retailer).
- **Code distributor + supplier:** 5 fitur Core sudah jalan (auth, dashboard, inventory, suppliers, orders UI + hooks + mocks). Order creation dialog sudah ada.
- **Code retailer:** completely unimplemented. Semua route, hook, mock, dan auth integration retailer-as-login belum dibangun.
- Halaman pending distributor: Retailers (CRM), Credit, Payment, Logistics, Analytics, AI Agents, Settings, Partnership (split dari Suppliers).
- Halaman pending supplier: Demand Intelligence, Geo Mapping, Distributor Management, Analytics, Settings.
- `useAuthStore` perlu update untuk support `role: "retailer"` sebelum implementasi UI retailer dimulai.

## Source of Truth

Sebelum mengubah kode frontend, baca dokumen-dokumen ini:

1. `frontend/autosup-complete.md`
   - visi produk lengkap, pain points, fitur per role (3 role: supplier, distributor, retailer), design prompts, framing UX. Sejak v3.0 ini menjadi rujukan utama scope MVP.
2. `frontend/PRD.md`
   - source of truth untuk scope MVP per fitur, behavior produk, acceptance criteria
3. `api-contract.md`
   - source of truth untuk endpoint, request/response shape, role naming, dan enum status
4. `frontend/AGENTS.md`
   - workflow agent, boundaries, stop conditions, dan handoff rules
5. `frontend/CLAUDE.md`
   - tech stack, coding conventions, dan implementation guardrails

Jika ada konflik:
- `api-contract.md` menang untuk kontrak data
- `frontend/PRD.md` menang untuk scope dan behavior produk
- `frontend/autosup-complete.md` menang untuk visi dan framing UX (saat behavior tidak diatur eksplisit di PRD)
- `frontend/AGENTS.md` dan `frontend/CLAUDE.md` mengatur cara implementasi frontend

## Konvensi Kerja Frontend

Aturan kerja yang perlu dijaga:
- UI harus role-aware untuk `distributor` dan `supplier`
- API call sebaiknya masuk lewat helper dan hooks, bukan fetch acak di komponen
- jangan gunakan `alert()` untuk error handling
- siapkan loading state, empty state, error state, dan happy path state
- tampilkan trust layer seperti partnership, escrow, dan reputation sebagai backend-driven result
- jangan menciptakan endpoint baru atau mengubah enum agar menyesuaikan UI

Prinsip implementasi:
- pertahankan scope tetap di Core MVP
- utamakan reusable component
- gunakan mock data hanya jika backend belum siap, tetapi shape-nya tetap harus mengikuti `api-contract.md`

## Status Implementasi

Repo frontend ini masih berada di fase awal menuju implementasi penuh Core MVP v3.0. Dokumen sudah lebih matang daripada code surface saat ini — dokumen mencakup 15 fitur distributor + 8 fitur supplier + 9 fitur retailer (3 role login penuh), sementara code baru implementasi 5 fitur Core untuk distributor + supplier (auth, dashboard, inventory, suppliers, orders). Retailer-as-login completely unimplemented.

Artinya:
- `autosup-complete.md` adalah visi & resource utama (3 role end-to-end)
- `PRD.md` mendefinisikan apa yang harus dibangun (per fitur, per role)
- `api-contract.md` mendefinisikan kontrak data untuk semua fitur (termasuk retailer-as-login dan yang masih planned)
- `AGENTS.md` mendefinisikan cara agent bekerja
- `CLAUDE.md` mendefinisikan aturan implementasi dan stack

Saat mulai coding fitur baru, ikuti urutan: baca section relevan di `autosup-complete.md` dan `PRD.md` → cek endpoint di `api-contract.md` → implement dengan pattern yang sudah ada (hooks → mocks fallback → komponen reusable → halaman).

## Verifikasi Saat Development

Sebelum menutup perubahan frontend, biasakan cek:

```bash
npm run lint
```

Untuk perubahan yang menyentuh route structure, App Router boundary, shared layout, atau wiring besar, pertimbangkan:

```bash
npm run build
```

Jika command verifikasi belum dijalankan, sebutkan itu secara eksplisit saat handoff.
