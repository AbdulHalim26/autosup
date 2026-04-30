# PRD AUTOSUP Frontend Core MVP

Status: Draft v3.0
Audience: Product, UI/UX, Frontend, Backend
Bahasa: Indonesia

## 1. Ringkasan Produk

AUTOSUP adalah platform supply chain berbasis AI dan trust layer untuk **3-tier supply chain UMKM: supplier → distributor → retailer**. Platform ini membantu bisnis mengelola stok, membangun kemitraan, mengeksekusi restock, mengatur pembayaran dan kredit, mengelola logistik pengiriman, serta mengambil keputusan berbasis data lewat AI assistive.

Sejak v3.0, **retailer adalah role login penuh** (sebelumnya entity-only). Retailer (kafe, restoran, bakery, retail UMKM) login dengan akun bisnisnya sendiri dan punya workspace lengkap untuk mengelola inventory, order ke supplier/distributor, payment, AI agents, dan analytics.

Masalah utama yang ingin diselesaikan (dari `frontend/autosup-complete.md` §2):
- Stok tidak terkontrol, sering kehabisan saat jam ramai.
- Cek stok masih manual, membebani staff yang bukan jobdesk-nya.
- Biaya operasional naik kalau harus hire staff khusus inventory.
- Pemesanan ke supplier dilakukan via chat tanpa tracking.
- Supplier tidak selalu ready dan tidak ada alternatif terdekat.
- Restock memakan banyak step manual: cek stok → catat → cari supplier → chat.
- Tidak ada sistem yang membantu pengambilan keputusan kapan dan berapa harus restock.
- Distributor sulit memberi credit line ke retailer secara terstruktur.
- Pembayaran rawan disengketakan, tidak ada perlindungan eskrow.
- Pengiriman tidak transparan, sulit memantau performa logistik.
- Operasional kecil-kecil mengganggu fokus growth.

Tujuan Core MVP:
- Memberikan visibilitas operasional harian end-to-end untuk distributor dan supplier.
- Menjadi sistem kerja utama untuk inventory, supplier partnership, order, retailer, credit, payment, logistics, dan analytics.
- Membantu user mengambil keputusan lebih cepat lewat AI assistive (restock, demand forecast, credit risk, logistics optimization, supplier recommendation).
- Menampilkan trust layer (partnership NFT, smart escrow, on-chain reputation) sebagai outcome backend yang terlihat sederhana di UI, tanpa membebani user dengan flow blockchain.

Target pengguna:
- `supplier`: pihak yang menyediakan barang, menerima partnership request, dan memproses order dari distributor (atau retailer langsung).
- `distributor`: bisnis yang membeli barang dari supplier untuk dijual kembali ke retailer; mengelola credit line, payment, logistics ke retailer clients.
- `retailer`: bisnis end-user (kafe, restoran, bakery, retail UMKM) yang beli stok dari distributor (atau langsung supplier) untuk operasional/dijual ke konsumen akhir.

> **Catatan dual-role retailer:** Distributor punya CRM untuk manage retailer clients-nya (endpoint `/retailers/*`). Ini berbeda dengan retailer yang login dengan akun bisnisnya sendiri (me-reuse endpoint role-aware seperti `/inventory`, `/orders`, dst). Dua concern ini co-exist tanpa konflik.

Nilai utama produk:
- Satu platform untuk operasional, finansial, logistik, dan insight — across 3-tier supply chain.
- Pengalaman role-aware: metric, CTA, dan navigasi menyesuaikan supplier vs distributor vs retailer.
- AI dan trust layer hadir sebagai enabler, bukan kompleksitas tambahan.

## 2. Role dan Prinsip Sistem

### Role login

**Distributor**
- Mengelola inventaris internal dan visibility stok supplier.
- Mencari, menilai, dan membangun partnership dengan supplier.
- Membuat order ke supplier partner; memantau order dari retailer.
- Mengelola retailer (segmentation, purchase history, demand intelligence).
- Mengelola credit line untuk retailer (limit, repayment, AI risk scoring).
- Memantau payment, invoice, escrow status, dan settlement.
- Memantau pengiriman (logistics) dengan tracking real-time.
- Melihat analytics performa bisnis dan rekomendasi AI agents.
- Mengatur konfigurasi akun, automation rules, integrations.

**Supplier**
- Mengelola katalog produk dan stok.
- Memantau distributor partner dan merespons partnership request.
- Memproses incoming order dan memperbarui status fulfillment.
- Melihat demand intelligence dan geo mapping demand.
- Melihat analytics performa produk, distributor, dan revenue.
- Mengatur konfigurasi akun, notifikasi, dan integrations.

**Retailer**
- Mengelola internal inventory bisnis (stok bahan baku/produk operasional) + AI restock recommendation.
- Membuat purchase order ke distributor partner (atau supplier langsung).
- Browse marketplace supplier/distributor + request partnership ke vendor baru.
- Memantau payment, invoice, available credit line, dan jadwal jatuh tempo.
- Pakai AI agents subset untuk optimasi cash flow, purchasing, demand forecast retail.
- Melihat analytics business performance: revenue, inventory turnover, supplier performance, forecast accuracy.
- Mengatur konfigurasi akun, business profile (industry type, branch locations), billing, team & permissions.

### Alur kerja inti

1. User register atau login dengan role `supplier`, `distributor`, atau `retailer`.
2. Sistem mengarahkan user ke dashboard sesuai role.
3. **Distributor** memantau inventory, low stock, supplier readiness, dan retailer demand.
4. **Distributor** meninjau supplier lalu membangun partnership (tercatat sebagai NFT di backend).
5. **Distributor** membuat order ke supplier (manual atau dari AI restock recommendation).
6. **Supplier** menerima order, memproses, lalu memperbarui status (`pending` → `processing` → `shipping` → `delivered`).
7. **Retailer** memantau internal stock + buat purchase order ke distributor (atau supplier langsung) untuk restock operasional.
8. **Distributor / Supplier** menerima order retailer, memproses sampai `delivered`.
9. Saat `delivered`, backend otomatis: release escrow → update reputation seller on-chain.
10. **Distributor** mengelola payment retailer (incoming), settlement supplier (outgoing), credit line, dan invoice; memantau pengiriman lewat logistics page.
11. **Retailer** memantau outgoing payment ke vendor + utilisasi credit line.
12. Semua role melihat analytics berkala dan AI agents recommendation.

### Status enum

**Inventory status**
- `in_stock`
- `low_stock`
- `out_of_stock`

**Order status**
- `pending`
- `processing`
- `shipping`
- `delivered`
- `cancelled`

**Escrow status**
- `held`
- `released`
- `refunded`

**Partnership request status**
- `pending`
- `accepted`
- `rejected`

**Credit account status**
- `active`
- `overdue`
- `suspended`
- `closed`

**Payment status**
- `pending`
- `paid`
- `partial`
- `failed`
- `refunded`

**Shipment status**
- `packed`
- `dispatched`
- `in_transit`
- `delivered`
- `delayed`
- `failed`

**Risk level**
- `low`
- `medium`
- `high`

**Urgency**
- `low`
- `medium`
- `high`

**Role login**
- `supplier`
- `distributor`
- `retailer`

**AI Agent name**
- `demand_forecast`
- `auto_restock`
- `credit_risk`
- `logistics_optimization`
- `supplier_recommendation`
- `price_optimization` (retailer)
- `cash_flow_optimizer` (retailer)

### Prinsip produk MVP

- Backend adalah source of truth untuk status, summary, transaction, dan trust layer state.
- Experience harus role-aware: metrik, CTA, navigasi, dan empty state menyesuaikan role.
- AI pada MVP bersifat *assistive*: memberi rekomendasi dan mempercepat keputusan, bukan auto-eksekusi penuh tanpa konfirmasi user.
- Blockchain dan escrow diperlakukan sebagai backend-driven trust layer yang surfaced di UI sederhana (badge, status chip, mint address dengan copy/explorer link).
- Wallet connection tidak diwajibkan untuk flow MVP umum. Wallet address relevan hanya pada konteks Partnership NFT dan Reputation surface.

## 3. Fitur MVP

Fitur dibagi per role: **Section 3A Distributor** dan **Section 3B Supplier**.  
Beberapa fitur dimiliki dua role (Auth, Inventory, Settings), dideskripsikan dengan acceptance criteria role-aware.

### 3.0 Authentication dan Role-Based Access

**Tujuan**  
User bisa masuk ke sistem dengan aman, dikenali role-nya, dan diarahkan ke workspace yang relevan.

**Role terkait**: `distributor`, `supplier`

**User stories**
- Sebagai user baru, saya ingin register dengan role yang dipilih, sehingga saya langsung masuk ke workspace sesuai role.
- Sebagai user existing, saya ingin login dengan email, password, dan reCAPTCHA token, sehingga session aktif aman dari bot.
- Sebagai user, saya ingin session saya tetap aktif lewat token refresh tanpa harus login ulang.
- Sebagai user yang belum login, saya ingin diarahkan ke login saat membuka halaman terproteksi.

**Acceptance criteria**
- Given user mengirim form register valid dengan role yang dipilih, when API `POST /auth/register` berhasil, then sistem menyimpan hasil autentikasi dan mengarahkan user ke dashboard sesuai role.
- Given user login dengan email, password, dan `recaptcha_token` valid, when API `POST /auth/login` berhasil, then session aktif dan data role digunakan untuk routing awal.
- Given `recaptcha_token` tidak dikirim atau gagal, when backend mengembalikan `CAPTCHA_MISSING` atau `CAPTCHA_FAILED`, then login diblokir dan user melihat pesan error ramah.
- Given access token kedaluwarsa tetapi refresh token masih valid, when aplikasi memanggil `POST /auth/refresh`, then session diperbarui tanpa memaksa login ulang.
- Given user belum login dan membuka halaman terproteksi, when session tidak tersedia, then user diarahkan ke halaman login.

**Dependensi/API**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`

---

## 3A. Fitur Distributor

### 3A.1 Dashboard Monitoring (Distributor)

**Tujuan**  
Pusat kontrol operasional distributor dengan ringkasan inventory, orders, supplier readiness, retailer activity, credit, payment, logistics, dan AI insights.

**User stories**
- Sebagai distributor, saya ingin melihat KPI inventory, order aktif, supplier partner, retailer aktif, dan AI agents recommendations dalam satu layar.
- Sebagai distributor, saya ingin melihat Inventory Intelligence Hub (stock health, low-stock alerts, fast-moving products, warehouse utilization).
- Sebagai distributor, saya ingin melihat Distribution Flow Monitor (retailer order intake, supplier replenishment, shipment progress, delayed deliveries).
- Sebagai distributor, saya ingin melihat Demand Forecast Analytics dan Supplier Network Snapshot.
- Sebagai distributor, saya ingin Quick Actions: Create Purchase Order, Manage Inventory, Review Suppliers, Track Deliveries.

**Acceptance criteria**
- Given user distributor login, when dashboard dimuat, then API `GET /dashboard/summary` menyediakan field `inventory`, `orders`, `suppliers`, `retailers`, `credit`, `payment`, `logistics`, `analytics_quick_stats`, dan `ai_insights`.
- Given AI insight bertype `restock_alert`, `demand_forecast`, `credit_risk`, `logistics_optimization`, atau `supplier_recommendation`, when ditampilkan, then urgency divisualisasikan konsisten dan ada CTA lanjutan ke halaman detail.
- Given data summary kosong, when dashboard dimuat, then sistem menampilkan empty state mengarah ke aksi pertama yang relevan.

**Dependensi/API**: `GET /dashboard/summary`, `GET /ai/agents/recommendations`

### 3A.2 Inventory Management (Distributor)

**Tujuan**  
Sistem kerja utama untuk memantau stok, minimum stock, kategori, riwayat masuk/keluar, dan kesiapan restock.

**User stories**
- Sebagai distributor, saya ingin CRUD item inventory dengan kategori, stock, min_stock, unit.
- Sebagai distributor, saya ingin melihat status `in_stock`/`low_stock`/`out_of_stock` mengikuti backend.
- Sebagai distributor, saya ingin melihat warehouse allocation dan turnover indicator.
- Sebagai distributor, saya ingin meminta AI restock recommendation dari item yang menipis dan langsung lanjut ke create order.

**Acceptance criteria**
- Given user membuka inventory, when `GET /inventory` berhasil, then daftar item, summary, pagination, dan filter tersedia.
- Given user CRUD item, when API berhasil, then UI ikut diperbarui tanpa reload paksa.
- Given item dengan status low_stock dipilih, when user klik "AI Restock", then `POST /ai/restock-recommendation` dipanggil dan hasil bisa diteruskan ke create order.
- Given list kosong, when halaman dimuat, then empty state mengarah ke "Add first item".

**Dependensi/API**: `GET /inventory`, `POST /inventory`, `PUT /inventory/{item_id}`, `DELETE /inventory/{item_id}`, `POST /ai/restock-recommendation`

### 3A.3 Supplier Stock Visibility

**Tujuan**  
Distributor bisa melihat ketersediaan stok di sisi supplier untuk perencanaan order yang lebih akurat.

**User stories**
- Sebagai distributor, saya ingin melihat list produk supplier partner beserta stok aktual mereka, status (`in_stock`/`low_stock`/`out_of_stock`), dan estimasi restock.

**Acceptance criteria**
- Given distributor membuka detail supplier partner, when `GET /suppliers/{supplier_id}/stock` berhasil, then daftar produk supplier ditampilkan dengan status stok dan estimasi restock dari backend.
- Given supplier bukan partner, when distributor coba akses, then UI menampilkan CTA untuk request partnership terlebih dahulu.

**Dependensi/API**: `GET /suppliers/{supplier_id}/stock`, `GET /suppliers`

### 3A.4 Suppliers (Discovery & Procurement)

**Tujuan**
Direktori supplier untuk procurement: mencari, membandingkan, dan mengelola sourcing day-to-day. Trust layer (active partnerships, NFT, contract management) di-handle di halaman Partnership terpisah (3A.4b).

**User stories**
- Sebagai distributor, saya ingin membedakan supplier `partner` vs `discover` di list.
- Sebagai distributor, saya ingin melihat reputation score, total transactions, on-time delivery rate, kategori, dan status aktif untuk benchmarking procurement.
- Sebagai distributor, saya ingin search & filter supplier by category, lokasi, dan reliability.
- Sebagai distributor, saya ingin lanjut ke create order langsung dari supplier card partner.

**Acceptance criteria**
- Given distributor membuka modul supplier, when `GET /suppliers` berhasil, then daftar supplier dibedakan partner vs discover.
- Given supplier `partner`, when distributor klik "Order Now", then redirect ke order create form dengan supplier prefilled.
- Given supplier `discover`, when distributor klik "Request Partnership", then redirect / open Partnership page (3A.4b).
- Given list kosong, when halaman dimuat, then empty state mengarah ke discover marketplace.

**Dependensi/API**: `GET /suppliers`, `GET /suppliers/{supplier_id}/stock`

---

### 3A.4b Partnership Management

**Tujuan**
Halaman dedicated untuk lifecycle partnership: kirim request, kelola active agreements, lihat blockchain trust verification, dan dapat AI partnership insight. Memisahkan concerns operational (procurement) dari concerns strategic (relationship/contract).

**User stories**
- Sebagai distributor, saya ingin overview KPI: Active Partnerships, Pending Agreements, Contract Renewal Rate, Partnership Trust Score, Network Growth.
- Sebagai distributor, saya ingin mengirim partnership request ke supplier dari Partnership page (selain dari Suppliers page).
- Sebagai distributor, saya ingin melihat Partner Ecosystem Overview yang categorized (suppliers, retailers, logistics partners).
- Sebagai distributor, saya ingin Contract Management hub: active agreements, expiring contracts, pending requests, terminated.
- Sebagai distributor, saya ingin Blockchain Trust Verification: smart contract-backed agreements, NFT credentials (mint address, explorer link), on-chain verification status.
- Sebagai distributor, saya ingin AI Partnership Insight (cth: "Supplier X high-value strategic partner berdasarkan delivery consistency").

**Acceptance criteria**
- Given distributor membuka Partnership page, when `GET /suppliers?type=partner` & `GET /blockchain/partnership-nft/{distributor_id}/{supplier_id}` (per partner) berhasil, then UI menampilkan partner cards dengan trust badge + mint address + explorer link.
- Given distributor klik "+ New Partnership Request", when form submitted, then `POST /suppliers/partnership-request` dipanggil dan status `pending` ditampilkan.
- Given `partnership_nft` null (mint pending), when partnership ditampilkan, then UI menyatakan trust layer masih diproses backend.
- Given AI insight tersedia via `GET /ai/agents/recommendations?agent=supplier_recommendation`, when ditampilkan, then ada confidence indicator + actionable next step.

**Dependensi/API**: `GET /suppliers?type=partner`, `POST /suppliers/partnership-request`, `GET /blockchain/partnership-nft/{distributor_id}/{supplier_id}`, `GET /ai/agents/recommendations`

### 3A.5 Orders dan Tracking (Distributor)

**Tujuan**  
Membuat order ke supplier partner, memantau progres, dan melihat hasil escrow saat selesai.

**User stories**
- Sebagai distributor, saya ingin membuat order dengan memilih supplier, item, qty, price_per_unit, delivery_address, dan notes.
- Sebagai distributor, saya ingin melihat list order saya dengan filter status dan role context (`buyer`).
- Sebagai distributor, saya ingin melihat order detail beserta status_history, escrow_status, dan estimated_delivery.
- Sebagai distributor, saya ingin lanjut dari AI restock recommendation langsung ke create order dengan field prefilled.

**Acceptance criteria**
- Given distributor memilih supplier dan item valid, when `POST /orders` berhasil, then order baru tercatat dengan status `pending` dan `escrow_status: held`.
- Given user membuka list orders, when `GET /orders?role=buyer` berhasil, then UI menampilkan list dengan filter status dan link ke detail.
- Given user membuka order detail, when `GET /orders/{order_id}` berhasil, then UI menampilkan timeline status, escrow status, items, total, dan delivery info.
- Given order menjadi `delivered`, when status tersimpan, then UI menampilkan info bahwa escrow release dan reputation update otomatis dijalankan backend.

**Dependensi/API**: `GET /orders`, `POST /orders`, `GET /orders/{order_id}`, `PUT /orders/{order_id}/status`, `POST /ai/restock-recommendation`

### 3A.6 Retailer Management

**Tujuan**  
Mengelola portfolio retailer yang menjadi pelanggan distributor: profile, segmentasi, frequency, history.

**User stories**
- Sebagai distributor, saya ingin CRUD retailer (nama, kontak, lokasi, segment).
- Sebagai distributor, saya ingin melihat purchase history, order frequency, dan account health per retailer.
- Sebagai distributor, saya ingin melihat top requested products dan trend demand per retailer.

**Acceptance criteria**
- Given distributor membuka halaman retailers, when `GET /retailers` berhasil, then daftar retailer dengan segmentation dan KPI ditampilkan.
- Given distributor menambah retailer baru, when `POST /retailers` berhasil, then retailer muncul di daftar.
- Given distributor membuka detail retailer, when `GET /retailers/{id}` berhasil, then purchase history dan demand intelligence ditampilkan.

**Dependensi/API**: `GET /retailers`, `POST /retailers`, `GET /retailers/{id}`, `PUT /retailers/{id}`

### 3A.7 Credit Line Management

**Tujuan**  
Distributor bisa memberikan kredit line ke retailer secara terstruktur, dengan tracking limit, utilization, repayment, dan AI risk scoring.

**User stories**
- Sebagai distributor, saya ingin membuka credit line untuk retailer dengan limit tertentu.
- Sebagai distributor, saya ingin melihat status credit account (`active`/`overdue`/`suspended`/`closed`), utilized amount, repayment progress, due date.
- Sebagai distributor, saya ingin AI menilai risiko retailer sebelum saya approve credit (score, level, max suggestion, recommendation).
- Sebagai distributor, saya ingin melihat overdue accounts dan dapat alert risk warning.

**Acceptance criteria**
- Given distributor membuka credit page, when `GET /credit/accounts` berhasil, then daftar credit account aktif dengan progress bar dan risk badge ditampilkan.
- Given distributor membuka form credit baru, when `POST /ai/credit-risk` berhasil, then AI risk assessment ditampilkan sebagai input keputusan.
- Given distributor approve, when `POST /credit/accounts` berhasil, then credit account tercatat dengan status `active`.
- Given credit account overdue, when list/detail dibuka, then risk monitoring panel menampilkan severity dan suggested action.

**Dependensi/API**: `GET /credit/accounts`, `POST /credit/accounts`, `PUT /credit/accounts/{id}`, `GET /credit/accounts/{id}/repayments`, `POST /ai/credit-risk`

### 3A.8 Payment

**Tujuan**  
Melihat dan mengelola transaksi: incoming retailer payments, outgoing supplier settlements, invoice, dan escrow.

**User stories**
- Sebagai distributor, saya ingin melihat list transaksi dengan filter (incoming/outgoing, status, periode).
- Sebagai distributor, saya ingin melihat invoice & settlement tracker dengan status (`pending`/`paid`/`partial`/`failed`/`refunded`).
- Sebagai distributor, saya ingin approve settlement ke supplier dan generate invoice ke retailer.
- Sebagai distributor, saya ingin melihat escrow status setiap order dan blockchain verification log.

**Acceptance criteria**
- Given distributor membuka payment page, when `GET /payments` berhasil, then list transaksi ditampilkan dengan filter.
- Given distributor membuka payment detail, when `GET /payments/{id}` berhasil, then escrow status, settlement progress, dan blockchain verification ditampilkan.
- Given distributor klik "Approve Settlement", when `POST /payments/settle` berhasil, then settlement tercatat dan UI ter-update.
- Given distributor generate invoice baru, when `POST /invoices` berhasil, then invoice muncul di list invoice.

**Dependensi/API**: `GET /payments`, `GET /payments/{id}`, `POST /payments/settle`, `GET /invoices`, `POST /invoices`, `GET /blockchain/escrow/{order_id}`

### 3A.9 Logistics

**Tujuan**  
Memantau pengiriman real-time, route, partner logistics, dan delivery performance.

**User stories**
- Sebagai distributor, saya ingin melihat live shipment tracker dengan ETA, route status, dan delay alerts.
- Sebagai distributor, saya ingin melihat fulfillment pipeline (Order packed → Dispatched → In Transit → Delivered).
- Sebagai distributor, saya ingin melihat regional delivery map dan demand hotspots.
- Sebagai distributor, saya ingin melihat list logistics partner dan reliability score.
- Sebagai distributor, saya ingin AI memberi recommendation rerouting saat ada congestion.

**Acceptance criteria**
- Given distributor membuka logistics page, when `GET /logistics/shipments` berhasil, then daftar shipment aktif dengan status dan ETA ditampilkan.
- Given distributor membuka shipment detail, when `GET /logistics/shipments/{id}` berhasil, then timeline, carrier info, dan stage progress ditampilkan.
- Given distributor klik "Optimize Route", when `PUT /logistics/shipments/{id}/route` berhasil, then route ter-update dan AI rationale ditampilkan.
- Given distributor membuka partners tab, when `GET /logistics/partners` berhasil, then daftar carrier dengan reliability dan capacity ditampilkan.

**Dependensi/API**: `GET /logistics/shipments`, `GET /logistics/shipments/{id}`, `PUT /logistics/shipments/{id}/route`, `GET /logistics/partners`

### 3A.10 Analytics (Distributor)

**Tujuan**  
Business intelligence dan performance optimization: revenue, fulfillment, inventory turnover, supplier performance, demand forecast.

**User stories**
- Sebagai distributor, saya ingin melihat overview KPI: revenue growth, fulfillment rate, inventory turnover, supplier performance index, demand forecast accuracy.
- Sebagai distributor, saya ingin melihat regional demand analysis dan top-performing areas.
- Sebagai distributor, saya ingin melihat partner contribution analytics dan AI predictive insights.

**Acceptance criteria**
- Given distributor membuka analytics, when `GET /analytics/distributor/overview` berhasil, then summary card dan trend chart ditampilkan.
- Given distributor switch ke regional view, when `GET /analytics/distributor/regional` berhasil, then map/heatmap demand per region ditampilkan.
- Given AI predictive insights tersedia, when ditampilkan, then ada confidence indicator dan actionable suggestion.

**Dependensi/API**: `GET /analytics/distributor/overview`, `GET /analytics/distributor/regional`, `GET /analytics/products/insights`

### 3A.11 AI Agents

**Tujuan**  
Halaman terpusat untuk semua AI agents: monitoring, konfigurasi automation level, dan recommendation feed.

**User stories**
- Sebagai distributor, saya ingin melihat list AI agents (Demand Forecast, Auto Restock, Credit Risk, Logistics Optimization, Supplier Recommendation) dan status masing-masing.
- Sebagai distributor, saya ingin mengatur automation level per agent (manual approval vs auto-execute) — namun MVP membatasi auto-execute.
- Sebagai distributor, saya ingin live recommendation feed dengan action button per recommendation.
- Sebagai distributor, saya ingin melihat AI performance insights: accuracy, savings, reduced delays.

**Acceptance criteria**
- Given distributor membuka AI agents page, when `GET /ai/agents` berhasil, then daftar agent dengan status dan recent actions ditampilkan.
- Given distributor mengubah config agent, when `PUT /ai/agents/{name}/config` berhasil, then config tersimpan; jika user pilih auto-execute, UI menampilkan warning bahwa MVP tetap require manual approval untuk action terminal (create order, settle payment).
- Given recommendation feed dimuat, when `GET /ai/agents/recommendations` berhasil, then card recommendation actionable ditampilkan.

**Dependensi/API**: `GET /ai/agents`, `PUT /ai/agents/{name}/config`, `GET /ai/agents/recommendations`, `POST /ai/restock-recommendation`, `POST /ai/demand-forecast`, `POST /ai/credit-risk`

### 3A.12 Settings (Distributor)

**Tujuan**  
Konfigurasi akun, business profile, automation, integrations, team & permissions, security, dan notifications.

**User stories**
- Sebagai distributor, saya ingin edit business profile, warehouse locations, currency, timezone.
- Sebagai distributor, saya ingin atur AI automation preferences (thresholds, approval requirements).
- Sebagai distributor, saya ingin connect ERP, payment gateway, wallet, manage API keys.
- Sebagai distributor, saya ingin enable 2FA dan lihat login activity.
- Sebagai distributor, saya ingin atur preferensi notifikasi (email alerts, low-stock, overdue payment, AI recommendation).

**Acceptance criteria**
- Given distributor membuka settings, when masing-masing API `GET /settings/*` berhasil, then form pre-filled dengan data backend.
- Given distributor save changes, when `PUT /settings/*` berhasil, then UI menampilkan toast sukses.
- Given distributor enable 2FA, when `POST /settings/security/2fa/enable` berhasil, then UI menampilkan secret/QR code untuk authenticator app.

**Dependensi/API**: `GET/PUT /settings/profile`, `GET/PUT /settings/business`, `GET/PUT /settings/notifications`, `GET /settings/integrations`, `PUT /settings/integrations/{type}`, `POST /settings/security/2fa/enable`, `POST /settings/security/2fa/disable`, `GET /settings/security/sessions`

---

## 3B. Fitur Supplier

### 3B.1 Dashboard Monitoring (Supplier)

**Tujuan**  
Pusat kontrol supplier dengan ringkasan produk, distributor partner, incoming orders, demand growth, dan AI insights.

**User stories**
- Sebagai supplier, saya ingin melihat KPI: Active Products, Distributor Partners, Incoming Orders, Demand Growth.
- Sebagai supplier, saya ingin melihat Demand Trend chart (line/area) dengan toggle Weekly/Monthly dan insight peak.
- Sebagai supplier, saya ingin melihat Top Products card dengan demand volume, growth indicator, dan badge (Hot/Declining).
- Sebagai supplier, saya ingin melihat AI Insights hero (1 main + 2-3 secondary).
- Sebagai supplier, saya ingin melihat Distributor Activity feed dan Incoming Orders quick list.

**Acceptance criteria**
- Given user supplier login, when dashboard dimuat, then `GET /dashboard/summary` menyediakan field `products`, `orders`, `partners`, `demand_intelligence`, `top_products`, `geo_demand_summary`, `ai_insights`.
- Given AI insights ditampilkan, when ada main insight, then divisualkan lebih besar dari secondary.
- Given dashboard kosong, when dimuat, then empty state mengarah ke "Add Product" atau "Update Stock".

**Dependensi/API**: `GET /dashboard/summary`, `GET /ai/agents/recommendations`

### 3B.2 Inventory / Products (Supplier)

**Tujuan**  
Manage product catalog, stock levels, dan respon ke demand changes.

**User stories**
- Sebagai supplier, saya ingin CRUD produk dengan kategori, stock, min_stock, unit, optional thumbnail.
- Sebagai supplier, saya ingin melihat status (`in_stock`/`low_stock`/`out_of_stock`) dan demand indicator.
- Sebagai supplier, saya ingin filter by category, stock status, demand level.
- Sebagai supplier, saya ingin melihat insight banner (misalnya "3 products experiencing high demand this week").

**Acceptance criteria**
- Sama dengan 3A.2 inventory management, dengan tambahan: response item supplier optional include `demand_indicator: "high" | "normal" | "low"` saat di-render.
- Given supplier filter & search, when `GET /inventory` dipanggil dengan query, then list ter-update sesuai.

**Dependensi/API**: `GET /inventory`, `POST /inventory`, `PUT /inventory/{item_id}`, `DELETE /inventory/{item_id}`

### 3B.3 Demand Intelligence

**Tujuan**  
Analisis produk terlaris per periode, perbandingan demand mingguan/bulanan, dan rekomendasi produksi dari AI.

**User stories**
- Sebagai supplier, saya ingin melihat produk terlaris per periode dan perbandingan trend.
- Sebagai supplier, saya ingin melihat insight produk naik/turun.
- Sebagai supplier, saya ingin AI memberi rekomendasi produksi.

**Acceptance criteria**
- Given supplier membuka demand intelligence, when `GET /analytics/supplier/overview` dan `POST /ai/demand-forecast` berhasil, then chart trend dan insight ditampilkan.
- Given user toggle period (week/month), when data tersedia, then chart re-render tanpa reload.

**Dependensi/API**: `GET /analytics/supplier/overview`, `POST /ai/demand-forecast`, `GET /ai/agents/recommendations`

### 3B.4 Geo Mapping Demand

**Tujuan**  
Visualisasi demand berbasis area/kota dengan heatmap dan distribusi produk.

**User stories**
- Sebagai supplier, saya ingin melihat heatmap demand per kota/area.
- Sebagai supplier, saya ingin filter per produk untuk melihat distribusi geografis.

**Acceptance criteria**
- Given supplier membuka geo page, when `GET /analytics/supplier/regional` berhasil, then heatmap atau geo chart ditampilkan dengan data demand per region.
- Given supplier filter per produk, when API dipanggil dengan query `?item_id=`, then peta ter-update.

**Dependensi/API**: `GET /analytics/supplier/regional`

### 3B.5 Distributor Management

**Tujuan**  
Mirror dari modul "Suppliers" di sisi distributor: supplier melihat distributor partner, performance, dan partnership requests masuk.

**User stories**
- Sebagai supplier, saya ingin melihat daftar distributor partner dan performa mereka (volume order, ketepatan pembayaran, riwayat transaksi).
- Sebagai supplier, saya ingin melihat list partnership requests masuk dan accept/reject.
- Sebagai supplier, saya ingin melihat status partnership (active/pending/rejected).

**Acceptance criteria**
- Given supplier membuka distributor management, when `GET /suppliers/partnership-requests` berhasil, then list request masuk dengan status ditampilkan.
- Given supplier accept request, when `PUT /suppliers/partnership-request/{request_id}` berhasil dengan `action: accept`, then status `accepted` dan partnership_nft di-mint backend (UI menampilkan badge sukses, atau pending bila mint masih on-progress).
- Given supplier reject, when API berhasil, then request hilang dari pending action.

**Dependensi/API**: `GET /suppliers/partnership-requests`, `PUT /suppliers/partnership-request/{request_id}`

### 3B.6 Order Management (Incoming)

**Tujuan**  
Mengelola incoming order dari distributor partner: list, detail, dan status update.

**User stories**
- Sebagai supplier, saya ingin melihat list orders dengan filter status dan distributor.
- Sebagai supplier, saya ingin update status order (`pending` → `processing` → `shipping` → `delivered`).
- Sebagai supplier, saya ingin melihat fulfillment insights (avg processing time, completion rate, delayed shipments).
- Sebagai supplier, saya ingin AI memprediksi spike incoming order minggu depan.

**Acceptance criteria**
- Given supplier membuka orders, when `GET /orders?role=seller` berhasil, then list order dengan filter ditampilkan.
- Given supplier update status, when `PUT /orders/{order_id}/status` berhasil, then status update tercermin di kedua sisi.
- Given order menjadi `delivered`, when status tersimpan, then UI menampilkan info bahwa escrow release & reputation update dijalankan backend.

**Dependensi/API**: `GET /orders`, `GET /orders/{order_id}`, `PUT /orders/{order_id}/status`, `GET /ai/agents/recommendations`

### 3B.7 Analytics (Supplier)

**Tujuan**  
Strategic insights: revenue, demand growth, fulfillment rate, distributor contribution, regional demand, product-level insights.

**User stories**
- Sebagai supplier, saya ingin melihat top metrics (Total Revenue, Demand Growth, Fulfillment Rate, Active Distributor Contribution).
- Sebagai supplier, saya ingin melihat main analytics chart dengan tabs (Revenue, Demand, Orders, Fulfillment).
- Sebagai supplier, saya ingin melihat distributor performance comparison.
- Sebagai supplier, saya ingin AI memberi business intelligence insight.

**Acceptance criteria**
- Given supplier membuka analytics, when `GET /analytics/supplier/overview` berhasil, then summary card dan main chart ditampilkan.
- Given switch tab, when data per tab tersedia, then chart re-render.
- Given regional analysis dipilih, when `GET /analytics/supplier/regional` berhasil, then heatmap ditampilkan.
- Given product-level insights tersedia, when `GET /analytics/products/insights` berhasil, then top selling, declining, stock-risk products ditampilkan.

**Dependensi/API**: `GET /analytics/supplier/overview`, `GET /analytics/supplier/regional`, `GET /analytics/products/insights`

### 3B.8 Settings (Supplier)

**Tujuan**  
Konfigurasi akun, business info, notifikasi, security, operational preferences, integrations.

**User stories**
- Sebagai supplier, saya ingin edit profile, business information (company name, business type, tax ID, warehouse address, service regions).
- Sebagai supplier, saya ingin atur notifikasi (new order alerts, low stock warnings, distributor requests, payment confirmations, weekly analytics).
- Sebagai supplier, saya ingin enable 2FA, lihat connected wallets, login sessions.
- Sebagai supplier, saya ingin atur operational preferences (default order processing time, stock threshold alerts, preferred logistics partner).
- Sebagai supplier, saya ingin connect ERP, payment gateway, blockchain wallet, manage API keys.

**Acceptance criteria**
- Sama dengan 3A.12 dengan tambahan field operational preferences khusus supplier.

**Dependensi/API**: Sama dengan 3A.12 (settings endpoints role-aware via auth context).

---

## 3C. Fitur Retailer

> Retailer (kafe, restoran, bakery, retail UMKM) adalah role login penuh sejak v3.0. Workspace retailer fokus ke operasional internal (inventory + restock), purchasing ke vendor, dan financial control (payment + credit usage). Sebagian besar endpoint role-aware sama dengan distributor (BE filter via auth context).

### 3C.1 Dashboard Monitoring (Retailer)

**Tujuan**
Pusat kontrol operasional retailer: snapshot stok, order aktif, spending bulanan, supplier reliability, AI business insights.

**User stories**
- Sebagai retailer, saya ingin melihat KPI: Total Inventory Items, Active Orders, Monthly Spending, Supplier Reliability, Forecast Accuracy.
- Sebagai retailer, saya ingin Inventory Health (stock level, low-stock alerts, fast-moving products, restock urgency).
- Sebagai retailer, saya ingin Order Tracking (pending, in-transit, completed, ETA).
- Sebagai retailer, saya ingin AI Business Insight banner (cth: "demand detergen naik 18% minggu depan, restock dari Supplier A").
- Sebagai retailer, saya ingin Spending & Demand Forecast Chart (monthly procurement spending, demand prediction, seasonal trends).
- Sebagai retailer, saya ingin Supplier Snapshot (top suppliers, trust score, delivery speed, partnership status).
- Sebagai retailer, saya ingin Quick Actions: Create Order, Request Quotation, Review Suppliers, Check Inventory.

**Acceptance criteria**
- Given user retailer login, when dashboard dimuat, then `GET /dashboard/summary` menyediakan field `inventory`, `orders`, `spending`, `suppliers`, `forecast_accuracy_pct`, `ai_insights` (sesuai shape retailer di api-contract §6).
- Given AI insight tipe `restock_alert`, `purchasing_optimization`, atau `cash_flow_recommendation`, when ditampilkan, then urgency divisualisasikan konsisten dan ada CTA lanjutan.
- Given data summary kosong, when dashboard dimuat, then empty state mengarah ke "Add first inventory item" atau "Create first order".

**Dependensi/API**: `GET /dashboard/summary`, `GET /ai/agents/recommendations`

### 3C.2 Inventory Management (Retailer)

**Tujuan**
Retailer manage internal stock untuk operasional bisnis (bahan baku kafe, packaging, produk jadi retail).

**User stories**
- Sebagai retailer, saya ingin CRUD item inventory dengan kategori, stock, min_stock, unit, optional SKU.
- Sebagai retailer, saya ingin lihat Total Products, Low Stock, Out of Stock, Inventory Value, Restock Priority.
- Sebagai retailer, saya ingin Low Stock Alerts panel dengan recommended reorder qty + supplier suggestion.
- Sebagai retailer, saya ingin AI Restock Recommendations (confidence score, predicted depletion date, one-click reorder).
- Sebagai retailer, saya ingin Inventory Trends chart + Category Overview cards.

**Acceptance criteria**
- Sama dengan 3A.2 (inventory generic role-aware), dengan tambahan: response item retailer optional include `inventory_value_idr` (qty × last_purchase_price) untuk calculation total value.
- Given AI restock dipanggil, when `POST /ai/restock-recommendation` berhasil, then hasil bisa diteruskan ke create order via prefill.

**Dependensi/API**: `GET /inventory`, `POST /inventory`, `PUT /inventory/{item_id}`, `DELETE /inventory/{item_id}`, `POST /ai/restock-recommendation`

### 3C.3 Orders (Retailer)

**Tujuan**
Buat purchase order ke distributor (atau supplier langsung), pantau delivery, dan dapat AI purchasing optimization (combine orders untuk hemat biaya).

**User stories**
- Sebagai retailer, saya ingin membuat order dengan memilih vendor (distributor partner atau supplier), item, qty, price_per_unit, delivery_address, notes.
- Sebagai retailer, saya ingin lihat KPI: Total Orders, Pending Approval, In Transit, Completed, Order Accuracy Rate.
- Sebagai retailer, saya ingin filter order by status, vendor, date range.
- Sebagai retailer, saya ingin Delivery Tracking timeline (Processing → Shipped → In Transit → Delivered).
- Sebagai retailer, saya ingin AI Purchasing Insight (cth: "gabungkan order detergen + minuman untuk hemat ongkir 12%").
- Sebagai retailer, saya ingin Delayed Orders Alerts panel.

**Acceptance criteria**
- Given retailer memilih vendor & item valid, when `POST /orders` berhasil, then order baru tercatat dengan `buyer.role = retailer`, `seller.role = distributor | supplier`, status `pending`, `escrow_status: held`.
- Given retailer membuka list orders, when `GET /orders?role=buyer` berhasil, then UI menampilkan order yang dia buat (filterable by status).
- Given retailer membuka order detail, when `GET /orders/{order_id}` berhasil, then UI menampilkan timeline status, escrow, items, delivery info.
- Given AI purchasing insight tersedia, when ditampilkan, then ada projected savings + quick action button.

**Dependensi/API**: `GET /orders`, `POST /orders`, `GET /orders/{order_id}`, `GET /ai/agents/recommendations`

### 3C.4 Suppliers / Vendors (Retailer)

**Tujuan**
Marketplace + relationship management untuk vendor retailer: partnered (existing) + available (discover). Sama pattern dengan 3A.4 distributor side.

**User stories**
- Sebagai retailer, saya ingin lihat KPI: Active Suppliers, Pending Requests, Reliability Score, Avg Delivery Time, Partnership Growth.
- Sebagai retailer, saya ingin dua section: Partnered Suppliers (existing) + Available Suppliers (marketplace discovery).
- Sebagai retailer, saya ingin AI Supplier Match Recommendations (vendor match berdasarkan price, delivery, stock).
- Sebagai retailer, saya ingin filter by category, region, rating.

**Acceptance criteria**
- Given retailer membuka suppliers page, when `GET /suppliers` berhasil, then list distributor/supplier dibedakan partner vs discover.
- Given AI supplier match tersedia via `GET /ai/agents/recommendations?agent=supplier_recommendation`, when ditampilkan, then confidence score + advantages + quick connect button.

**Dependensi/API**: `GET /suppliers`, `GET /suppliers/{supplier_id}/stock`, `GET /ai/agents/recommendations`

### 3C.5 Partnership (Retailer)

**Tujuan**
Mirror dari 3A.4b distributor partnership: kelola active agreements, blockchain trust verification, NFT-based partnership credentials.

**User stories**
- Sama dengan 3A.4b, role-aware untuk retailer.

**Acceptance criteria**
- Sama dengan 3A.4b. Retailer kirim partnership request ke supplier/distributor; trust layer surface sebagai NFT badge + explorer link.

**Dependensi/API**: `GET /suppliers?type=partner`, `POST /suppliers/partnership-request`, `GET /blockchain/partnership-nft/{distributor_id}/{supplier_id}` (rename param sesuai context — BE handle), `GET /ai/agents/recommendations`

### 3C.6 Payments (Retailer)

**Tujuan**
Track outgoing payment ke vendor, manage invoice, manfaatkan available credit line, dan dapat AI cash flow optimization.

**User stories**
- Sebagai retailer, saya ingin KPI: Total Outstanding, Paid This Month, Available Credit, Upcoming Due Payments, Payment Success Rate.
- Sebagai retailer, saya ingin Invoice Management: list invoice dari vendor dengan filter status (pending/paid/overdue) dan quick pay.
- Sebagai retailer, saya ingin Credit & Financing Panel: available credit line dari distributor partner, repayment schedule, utilization %.
- Sebagai retailer, saya ingin Secure Payment Methods (bank transfer, e-wallet, escrow, credit line) terkoneksi.
- Sebagai retailer, saya ingin AI Cash Flow Recommendations (cth: "tunda pembayaran non-essential 3 hari").
- Sebagai retailer, saya ingin Alerts untuk overdue invoice & upcoming deadlines.

**Acceptance criteria**
- Given retailer membuka payment page, when `GET /payments?direction=outgoing` berhasil, then list transaction ke vendor ditampilkan.
- Given retailer membuka payment detail, when `GET /payments/{id}` berhasil, then escrow status, settlement progress, dan blockchain verification log ditampilkan.
- Given retailer punya active credit line, when dashboard credit panel dimuat, then available credit, due date, utilization % ditampilkan (data dari distributor's `/credit/accounts/{id}` yang punya retailer).

**Dependensi/API**: `GET /payments`, `GET /payments/{id}`, `GET /invoices`, `GET /blockchain/escrow/{order_id}`, `GET /ai/agents/recommendations?agent=cash_flow_optimizer`

### 3C.7 AI Agents (Retailer)

**Tujuan**
Halaman terpusat untuk AI agents retailer: monitoring, automation rules, recommendation feed, performance insights.

**User stories**
- Sebagai retailer, saya ingin list AI agents subset: Auto Restock, Demand Forecast, Supplier Recommendation, Price Optimization, Cash Flow Optimizer.
- Sebagai retailer, saya ingin atur automation rules (trigger conditions, actions) per agent.
- Sebagai retailer, saya ingin Activity & Decision Log (audit trail tindakan AI).
- Sebagai retailer, saya ingin live recommendation feed dengan quick approve/reject.
- Sebagai retailer, saya ingin AI Performance Insights (impact of decisions, cost savings, efficiency improvements).

**Acceptance criteria**
- Given retailer membuka AI agents page, when `GET /ai/agents` berhasil, then daftar agent (filtered by role retailer) dengan status & recent actions ditampilkan.
- Given retailer mengubah config agent, when `PUT /ai/agents/{name}/config` berhasil, then config tersimpan; auto-execute untuk action terminal (create order, settle payment) tetap require manual approval di MVP.

**Dependensi/API**: `GET /ai/agents`, `PUT /ai/agents/{name}/config`, `GET /ai/agents/recommendations`, `POST /ai/restock-recommendation`, `POST /ai/demand-forecast`

### 3C.8 Analytics (Retailer)

**Tujuan**
Strategic insight: revenue growth, inventory turnover, supplier performance, order fulfillment, forecast accuracy.

**User stories**
- Sebagai retailer, saya ingin Executive KPI: Revenue Growth, Inventory Turnover, Supplier Performance, Order Fulfillment Rate, Forecast Accuracy.
- Sebagai retailer, saya ingin Business Performance Overview (revenue trends, spending, profit margin).
- Sebagai retailer, saya ingin Inventory Intelligence (fast-moving vs slow-moving, stock aging, stockout frequency).
- Sebagai retailer, saya ingin Supplier Performance Analytics (delivery speed, accuracy, pricing, trust score).
- Sebagai retailer, saya ingin AI Predictive Insights & Financial Insights (spending by supplier, invoice trends, payment cycle).
- Sebagai retailer, saya ingin Market & Demand Trends (regional, category growth, seasonal).
- Sebagai retailer, saya ingin Report Center untuk download laporan inventory/supplier/spending/forecast.

**Acceptance criteria**
- Given retailer membuka analytics, when `GET /analytics/retailer/overview` berhasil (BE handle role-aware via existing analytics endpoints + auth context), then summary card + chart ditampilkan.
- Given regional view dipilih, when endpoint regional retailer berhasil, then heatmap/region ranking ditampilkan.

**Dependensi/API**: `GET /analytics/products/insights` (shared), retailer-specific analytics endpoints role-aware (BE detect via auth context dari `/analytics/*`).

### 3C.9 Settings (Retailer)

**Tujuan**
Konfigurasi akun, business profile, security, notifications, integrations, AI preferences, billing & subscription, team management, compliance.

**User stories**
- Sebagai retailer, saya ingin edit Business Profile (business name, company logo, industry type, business address, branch locations, tax ID).
- Sebagai retailer, saya ingin Security: change password, 2FA, login history, active sessions, device management.
- Sebagai retailer, saya ingin Notification Preferences (low-stock alerts, order updates, payment reminders, partnership requests, AI recommendations).
- Sebagai retailer, saya ingin Integrations (accounting tools, payment gateways, logistics providers, ERP/POS, blockchain wallet).
- Sebagai retailer, saya ingin AI Preferences (automation sensitivity, forecasting depth, approval thresholds, auto-restock permissions).
- Sebagai retailer, saya ingin Billing & Subscription (current plan, payment method, invoices AUTOSUP, usage summary, upgrade options).
- Sebagai retailer, saya ingin Team Management (roles & permissions, invite members, access levels, department assignments).
- Sebagai retailer, saya ingin Compliance & Policies (privacy policy, ToS, smart contract agreements, audit logs).

**Acceptance criteria**
- Sama dengan 3A.12, dengan tambahan field role-aware (industry_type, branch_locations, billing_subscription, team_members) sesuai api-contract §14.

**Dependensi/API**: `GET/PUT /settings/profile`, `GET/PUT /settings/business`, `GET/PUT /settings/notifications`, `GET /settings/integrations`, `PUT /settings/integrations/{type}`, `POST /settings/security/2fa/enable`, `POST /settings/security/2fa/disable`, `GET /settings/security/sessions`

---

## 4. Future Phase / Out of Scope

Setelah scope MVP diperluas mengikuti `frontend/autosup-complete.md` (termasuk retailer sebagai role login penuh), hanya item berikut yang tetap *out of scope* di MVP awal ini:

- **Auto-order penuh tanpa konfirmasi user.** AI agents di MVP membatasi auto-execute untuk action terminal (create order, settle payment, approve credit). User tetap diberi konfirmasi minimal sekali. Full hands-free automation diposisikan sebagai roadmap.
- **Wallet-native flow di end-user surface.** Wallet connection tidak diwajibkan untuk flow umum. Halaman blockchain khusus user (mint manual, transfer, swap) tidak masuk MVP.
- **Multi-warehouse advanced allocation algorithm.** Warehouse allocation map dasar masuk MVP, tetapi optimasi alokasi multi-region berbasis advanced solver diposisikan sebagai roadmap.
- **Native mobile app.** MVP fokus ke responsive web app (Next.js).
- **Multi-currency selain IDR.** Settings menyediakan field currency tetapi MVP fix ke IDR.

## 5. Catatan Implementasi

- **Source of truth ordering:**
  1. `frontend/autosup-complete.md` — visi produk, fitur per role (3 role: supplier, distributor, retailer), design prompts, framing UX (MVP scope sekarang sudah union dengan dokumen ini).
  2. `frontend/PRD.md` — scope MVP, behavior produk, acceptance criteria.
  3. `api-contract.md` — endpoint, request/response shape, role naming, enum status.
- Semua fitur selain authentication adalah protected route (JWT required).
- Error handling pakai pesan ramah dan toast/inline; jangan `alert()`.
- Trust layer (partnership NFT, escrow, reputation) ditampilkan sebagai badge/status sederhana di UI; flow blockchain dikelola backend.
- Inventory item tidak menyimpan harga. Harga (`price_per_unit`) diinput distributor saat create order.
- Pembayaran end-user tetap pakai IDR via Xendit/Midtrans; eskrow di-track di backend, hasil status di-surface di Order Detail dan Payment page.
- Saat backend belum siap, frontend pakai mock data lokal (`lib/mocks/*.ts`) yang shape-nya tetap mengikuti `api-contract.md`. Toggle mock vs real API via env (`NEXT_PUBLIC_USE_MOCK`).
