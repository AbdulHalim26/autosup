@AGENTS.md

# AUTOSUP Frontend AI Instructions

Dokumen ini berisi instruksi khusus untuk AI yang bekerja di folder `frontend/`.
Tujuannya agar implementasi konsisten dengan PRD, API contract, dan arsitektur tim.

## 1. Project Context

AUTOSUP adalah platform supply chain untuk **3 role login utama** (3-tier supply chain):
- `supplier`
- `distributor`
- `retailer`

Frontend ini dipakai untuk dashboard operasional yang responsif, cepat, dan mudah dipakai oleh UMKM. Fokus Core MVP (v3.0) sudah disamakan dengan `frontend/autosup-complete.md`:

**Distributor (15 fitur):**
- authentication & role-based access · dashboard monitoring · inventory management · supplier stock visibility · suppliers (discovery & procurement) · partnership management · orders & tracking · retailer management (CRM) · credit line management · payment · logistics · analytics · AI agents · settings

**Supplier (8 fitur):**
- authentication & role-based access · dashboard monitoring · inventory/products · demand intelligence · geo mapping demand · distributor management · orders incoming · analytics · settings

**Retailer (9 fitur — BARU di v3.0):**
- authentication & role-based access · dashboard monitoring · inventory management · orders (purchase to vendor) · suppliers/vendors discovery · partnership · payments · AI agents · analytics · settings

Detail acceptance criteria per fitur di `frontend/PRD.md` Section 3A (distributor), 3B (supplier), dan 3C (retailer).

Source of truth produk dan API:
- `frontend/autosup-complete.md`
- `frontend/PRD.md`
- `api-contract.md`

Jika ada konflik:
1. `api-contract.md` menang untuk endpoint, role, status enum, dan response shape
2. `frontend/PRD.md` menang untuk scope MVP dan behavior produk
3. `frontend/autosup-complete.md` menang untuk visi produk dan framing UX

Sejak v3.0, scope MVP sudah merupakan union dari fitur autosup-complete.md dan PRD.md (3 role lengkap). Item yang masih *out of scope* tercatat di `PRD.md` Section 4 (auto-order penuh tanpa konfirmasi user, wallet-native flow di end-user surface, multi-warehouse advanced allocation algorithm, native mobile app, multi-currency selain IDR).

## 2. Tech Stack

### Frontend
- Framework: Next.js 16+ dengan App Router
- Styling: Tailwind CSS
- Component Library: Shadcn/UI dan/atau Radix UI
- Data Fetching: React Query (@tanstack/react-query) untuk server state management
- State Management: Zustand sebagai default untuk client-side global state; React Context hanya untuk scope sempit
- Deployment: Vercel

### Backend and Data
- Backend API: FastAPI
- Language: Python 3.10+
- Validation: Pydantic
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth dengan JWT
- Backend hosting: Render atau Railway

### AI Layer
- Provider: Google Gemini API
- Use cases utama:
  - smart inventory dan restock recommendation
  - credit risk analysis
  - demand forecasting
- Output AI dari backend harus diperlakukan sebagai JSON terstruktur, bukan free-form text

### Web3 Layer
- Chain: Solana Devnet
- Smart contract language: Rust
- Framework: Anchor
- Use cases utama:
  - Partnership SBT / Soulbound Token
  - reputation scoring on-chain

Catatan penting: frontend tidak menjadi pemilik logic blockchain. Frontend hanya menampilkan hasil trust layer dari backend.

## 3. Product and UX Rules

### Role awareness
- Semua pengalaman harus menyesuaikan role `supplier`, `distributor`, atau `retailer`
- Jangan tampilkan CTA distributor di workspace supplier/retailer
- Jangan tampilkan action supplier di workspace distributor/retailer
- Jangan tampilkan distributor-only modules (Retailers CRM, Credit Line, Logistics) di workspace retailer/supplier
- Dashboard, empty state, CTA, dan navigation harus role-aware untuk 3 role
- `logistics partner` tetap *entitas* yang dikelola distributor (managed via `/logistics/partners`), bukan role login.
- **Dual-role retailer concept:** distributor punya `/retailers/*` (CRM untuk manage retailer clients-nya). Retailer juga bisa login dengan akun bisnis sendiri (me-reuse endpoint role-aware seperti `/inventory`, `/orders`, `/suppliers`, `/payments`, `/settings`, `/analytics/*`, `/ai/*`). Dua concern co-exist tanpa konflik.
- Wallet & blockchain interaction tetap backend-driven untuk semua role.

### MVP boundaries
- Kerjakan fitur yang masuk Core MVP di `frontend/PRD.md` Section 3A (distributor), 3B (supplier), dan 3C (retailer)
- Tetap *out of scope*: auto-execute action terminal tanpa konfirmasi user (create order, settle payment, approve credit), wallet-native flow di end-user surface, multi-warehouse advanced allocation, native mobile app, multi-currency selain IDR
- AI recommendation di MVP bersifat assistive untuk semua agent (Demand Forecast, Auto Restock, Credit Risk, Logistics Optimization, Supplier Recommendation, Price Optimization, Cash Flow Optimizer); BE tetap require manual approval untuk action terminal meski user pilih `auto_execute` di config

### UX principles
- Dashboard harus cepat dibaca dan fokus pada tindakan
- Empty state harus membantu user memulai langkah berikutnya
- Error message harus ramah, singkat, dan kontekstual
- Jangan gunakan `alert()`
- Gunakan toast, inline validation, atau status banner untuk feedback

### Trust layer rules
- Escrow, partnership NFT, dan supplier reputation ditampilkan sebagai hasil sistem
- Jangan memaksa user connect wallet untuk flow MVP umum
- Wallet address hanya relevan pada konteks partnership dan reputation surface

## 4. Coding Rules

### General
- Gunakan TypeScript secara ketat
- Utamakan server/client boundary yang jelas di App Router
- Ikuti pola Next.js modern; jangan mengandalkan asumsi lama
- Sebelum mengubah pola framework, cek dokumentasi Next.js lokal bila dibutuhkan

### Data access
- Semua komunikasi ke backend harus melalui helper API dan custom hook, bukan fetch acak di komponen UI
- Bungkus API call dalam lapisan yang rapi, misalnya:
  - `lib/api.ts` untuk request helper
  - `hooks/useAuth.ts`
  - `hooks/useInventory.ts`
  - `hooks/useOrders.ts`
- Gunakan response envelope dari `api-contract.md`:
  - `success`
  - `data`
  - `message`
  - `error_code` bila gagal

### State management
- Gunakan Zustand untuk state global seperti session, user profile, active role, dan UI state lintas halaman
- Jangan simpan data server yang seharusnya bisa di-refetch sebagai global state tanpa alasan jelas
- State form lokal tetap di komponen atau form layer masing-masing

### Components
- Prioritaskan komponen reusable untuk:
  - status badge
  - summary card
  - table/list inventory
  - supplier card/list
  - order status timeline
  - AI insight card
- Gunakan Shadcn/UI atau Radix UI bila ada komponen dasar yang cocok
- Jangan membuat komponen custom yang kompleks jika primitive library sudah memadai

### Styling
- Gunakan Tailwind utility classes
- Gunakan desain dashboard yang padat, rapi, dan fokus kerja
- Hindari layout marketing, hero page, atau halaman dekoratif
- Gunakan color cues yang konsisten untuk state:
  - navy `#0F172A`
  - blue `#3B82F6`
  - green `#22C55E`
  - orange `#F59E0B`
  - red `#EF4444`

## 5. Data and API Conventions

### Auth
- Endpoint protected wajib kirim `Authorization: Bearer <supabase_jwt_token>`
- Handle token refresh dengan mulus bila memungkinkan
- Login wajib mengirim `recaptcha_token`

### Roles
- Gunakan hanya role berikut:
  - `supplier`
  - `distributor`
  - `retailer`
- Jangan membuat alias role lain di UI atau data model

### Inventory
- Gunakan status backend apa adanya:
  - `in_stock`
  - `low_stock`
  - `out_of_stock`
- Inventory adalah source utama untuk trigger AI recommendation

### Orders
- Gunakan hanya status berikut:
  - `pending`
  - `processing`
  - `shipping`
  - `delivered`
  - `cancelled`
- Ketika status `delivered`, frontend hanya menampilkan bahwa escrow release dan reputation update diproses backend

### Suppliers and partnership
- Supplier listing minimal perlu membedakan:
  - `partner`
  - `discover`
- Partnership accept/reject hanya boleh dilakukan oleh role `supplier`
- Partnership NFT diperlakukan sebagai metadata hasil backend, bukan action on-chain langsung dari frontend
- `GET /suppliers/{supplier_id}/stock` hanya bisa dipanggil distributor untuk supplier yang sudah `partner`. Jika 403 `SUPPLIER_NOT_PARTNER`, UI tampilkan CTA request partnership.

### Retailers (distributor CRM)
- Endpoint `/retailers/*` adalah **distributor-side CRM** untuk manage retailer clients-nya. Tidak berlaku untuk retailer-as-login (lihat subsection berikutnya).
- Segment enum: `premium` · `regular` · `new`. Status enum: `active` · `inactive` · `high_risk`.
- Detail retailer include `purchase_history`, `demand_intelligence`, `credit_summary` (opsional).

### Retailer-as-login (role-specific data)
- Retailer me-reuse endpoint role-aware yang sama dengan distributor/supplier (`/inventory`, `/orders`, `/suppliers`, `/payments`, `/settings`, `/analytics/*`, `/ai/*`); BE filter berdasarkan auth context.
- Retailer's "supplier" di UI = distributor (atau supplier langsung). Generic terminology — retailer treats whoever supplies them as "supplier/vendor".
- Retailer's order: `buyer.role = retailer`, `seller.role = distributor | supplier`. Filter `?role=buyer` di `/orders` untuk lihat order yang retailer buat.
- Retailer dashboard punya field-specific shape: `inventory`, `orders`, `spending` (total_outstanding, monthly_spending, available_credit, upcoming_due_payments, payment_success_rate), `suppliers` (active_partnered, pending_requests, average_reliability_score, avg_delivery_time), `forecast_accuracy_pct`, `ai_insights` (lihat api-contract §6 retailer response).
- Available credit retailer berasal dari distributor's `/credit/accounts` yang punya retailer tersebut — surfaced di dashboard `spending.available_credit` dan Payment page Credit & Financing panel.

### Credit Line (distributor only)
- Status enum: `active` · `overdue` · `suspended` · `closed`. Risk level: `low` · `medium` · `high`.
- Sebelum `POST /credit/accounts`, FE disarankan call `POST /ai/credit-risk` dan tampilkan hasilnya sebagai context.
- `POST /credit/accounts` adalah action terminal — selalu require konfirmasi user.

### Payment
- Direction: `incoming` · `outgoing`. Status: `pending` · `paid` · `partial` · `failed` · `refunded`. Method: `bank_transfer` · `e_wallet` · `credit_line` · `escrow_release`.
- Currency MVP fix ke IDR (Xendit/Midtrans).
- Escrow status (`held` · `released` · `refunded`) di-surface dari backend di Order Detail dan Payment Detail; jangan compute di FE.
- `POST /payments/settle` adalah action terminal — selalu require konfirmasi user.

### Logistics (distributor only)
- Shipment status: `packed` · `dispatched` · `in_transit` · `delivered` · `delayed` · `failed`.
- Carrier / contract status: `active` · `expiring` · `expired` · `pending`.
- AI logistics recommendation di-render sebagai banner/badge; user tetap approve manual sebelum apply.

### Analytics
- Endpoint role-aware via auth context (`/analytics/distributor/*` vs `/analytics/supplier/*`); FE pilih sesuai role aktif.
- Period query param: `week` · `month` · `quarter`.
- Render chart pakai library yang sudah dipakai (atau primitive bar/line dari komponen yang ada). Hindari heavy chart lib bila tidak perlu.

### AI Agents
- Agent name enum: `demand_forecast` · `auto_restock` · `credit_risk` · `logistics_optimization` · `supplier_recommendation` · `price_optimization` · `cash_flow_optimizer`.
- Status enum: `active` · `paused` · `disabled`. Automation level: `manual_approval` · `auto_with_threshold` · `auto_execute`.
- **Agent availability per role:**
  - Distributor: `demand_forecast`, `auto_restock`, `credit_risk`, `logistics_optimization`, `supplier_recommendation`
  - Supplier: `demand_forecast`
  - Retailer: `auto_restock`, `demand_forecast`, `supplier_recommendation`, `price_optimization`, `cash_flow_optimizer`
- Live recommendation feed di `GET /ai/agents/recommendations` sudah include `actionable_link` — FE cukup pakai link tersebut sebagai navigasi.

### Settings
- Endpoint role-aware. Field business form berbeda per role:
  - Distributor: `warehouse_locations`, `service_regions`
  - Supplier: `production_facilities`
  - Retailer: `industry_type`, `branch_locations`, `billing_subscription`, `team_members`, `compliance_docs`
- FE pilih form schema sesuai role.
- 2FA pakai TOTP. FE tampilkan QR + secret saat enable; user input TOTP code saat disable.
- Credentials integration jangan ditampilkan ulang setelah save (write-only field).

### AI output (umum)
- Asumsikan hasil AI sudah divalidasi backend dan dikirim sebagai JSON siap pakai
- Frontend cukup merender urgency, recommendation text, suggested context, dan link aksi
- Untuk action terminal, selalu route via flow konfirmasi (jangan execute otomatis dari recommendation card)

## 6. File and Architecture Conventions

Gunakan struktur ini sebagai arah kerja:
- `app/` untuk routes App Router
- `components/` untuk reusable UI
- `hooks/` untuk data hooks dan feature hooks
- `store/` untuk Zustand stores
- `lib/` untuk API client, utilities, constants, dan shared helpers

Layout direktori target untuk fitur MVP v3.0:

**Routes shared (semua role pakai, role-aware via auth context):**
- `app/auth/login/`, `app/auth/register/`
- `app/dashboard/layout.tsx` — shell sidebar role-aware (3 role config)
- `app/dashboard/dashboard/` — dashboard role-aware (catatan: nested path; pertimbangkan refactor ke `app/dashboard/page.tsx` saat ada keputusan)
- `app/dashboard/inventory/`
- `app/dashboard/orders/`
- `app/dashboard/suppliers/` — distributor & retailer (vendor list)
- `app/dashboard/payment/` — distributor (incoming + outgoing) & retailer (outgoing)
- `app/dashboard/analytics/` — semua role, data berbeda
- `app/dashboard/ai-agents/` — distributor & retailer (subset agents berbeda)
- `app/dashboard/settings/`

**Routes shared distributor + retailer:**
- `app/dashboard/partnership/` — BARU di v3.0, halaman dedicated terpisah dari `suppliers/`. Untuk distributor: kelola partnership ke supplier. Untuk retailer: kelola partnership ke distributor/supplier vendor.

**Routes distributor only:**
- `app/dashboard/retailers/` — CRM untuk manage retailer clients (≠ retailer-as-login)
- `app/dashboard/credit/` — credit line yang distributor berikan ke retailer
- `app/dashboard/logistics/` — shipment & route management

**Routes supplier only:**
- `app/dashboard/demand/` — Demand Intelligence
- `app/dashboard/geo/` — Geo Mapping
- `app/dashboard/distributors/` — mirror Suppliers untuk supplier (kelola distributor partner)

Sidebar menentukan visibility per role; route guard di `dashboard/layout.tsx` blokir akses lintas role.

**Hooks dan store yang diharapkan ada:**
- `hooks/useAuth.ts`, `useDashboard.ts`, `useInventory.ts`, `useOrders.ts`, `useSuppliers.ts` (sudah ada sebagian)
- `hooks/useRetailers.ts` (distributor CRM), `useCredit.ts`, `usePayments.ts`, `useLogistics.ts`, `useAnalytics.ts`, `useAiAgents.ts`, `useSettings.ts`, `usePartnership.ts` (planned)
- `store/useAuthStore.ts` (sudah ada — perlu extend `user.role` untuk include `retailer`)

Konvensi umum:
- Satu file, satu tanggung jawab utama
- Nama komponen pakai PascalCase
- Nama hook pakai `useXxx`
- Nama store jelas, misalnya `useAuthStore`
- Jangan campur hardcoded mock besar ke dalam komponen; taruh di `lib/mocks/<feature>.ts` bila perlu

## 7. Implementation Preferences for AI

Saat menulis atau mengubah kode frontend:
- Mulai dari PRD dan API contract, bukan dari tebakan
- Pilih solusi paling sederhana yang sesuai pola repo
- Utamakan komponen reusable dibanding copy-paste UI
- Jaga perubahan tetap terlokalisasi ke scope fitur yang sedang dikerjakan
- Jika backend belum siap, gunakan mock data yang bentuknya tetap mengikuti `api-contract.md`
- Jangan mengubah naming endpoint, enum, atau response envelope tanpa instruksi eksplisit

Saat membuat halaman baru:
- sediakan loading state
- sediakan empty state
- sediakan error state
- sediakan happy path state
- pertimbangkan role gating sejak awal

Saat membuat form:
- validasi field wajib
- tampilkan error inline bila relevan
- disable submit saat request berjalan
- tampilkan success/error feedback yang jelas

## 8. Non-Goals

AI yang bekerja di frontend tidak boleh:
- menciptakan flow blockchain langsung dari browser tanpa kebutuhan jelas (mint, transfer, swap manual oleh user)
- mengeksekusi action terminal otomatis tanpa konfirmasi user (create order, settle payment, approve credit, reroute shipment) meskipun config AI agent `auto_execute`
- menambah fitur di luar Core MVP v2.0 hanya karena terlihat menarik (lihat `PRD.md` Section 4 untuk daftar yang masih out of scope)
- mengubah kontrak API seenaknya
- memakai `alert()` untuk error handling
- membuat UI yang terasa seperti landing page marketing
- menambah currency selain IDR di MVP awal

## 9. Definition of Good Output

Output dianggap baik jika:
- konsisten dengan `frontend/PRD.md`
- konsisten dengan `api-contract.md`
- role-aware untuk distributor dan supplier
- mudah diimplementasikan lanjut oleh tim
- memakai pola Next.js + Tailwind + Shadcn/Radix + Zustand yang rapi
- siap di-deploy ke Vercel tanpa asumsi aneh
