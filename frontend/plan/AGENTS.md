<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AUTOSUP Frontend Agent Workflow

Dokumen ini adalah instruksi level-1 untuk agent yang bekerja di folder `frontend/`.
Fokus utamanya adalah workflow kerja, batasan, stop conditions, dan cara handoff.

Dokumen pendamping:
- `frontend/autosup-complete.md`: visi produk, fitur per role, design prompts, framing UX
- `frontend/CLAUDE.md`: tech stack, coding rules, product conventions
- `frontend/PRD.md`: scope MVP, behavior produk, user stories
- `api-contract.md`: source of truth untuk API, roles, enum, dan response shape

## 1. Tujuan Dokumen

Agent yang bekerja di `frontend/` bertugas membangun dashboard app AUTOSUP berbasis Next.js App Router untuk **3 role login**:
- `supplier`
- `distributor`
- `retailer`

Scope agent ini adalah frontend application layer, bukan seluruh sistem. Agent tidak menjadi pemilik logic backend, database, AI inference, atau blockchain execution.

## 2. Urutan Source of Truth

Saat ada keputusan implementasi, gunakan urutan berikut:

1. `api-contract.md`
   - endpoint
   - request/response shape
   - role naming
   - enum dan status
2. `frontend/PRD.md`
   - scope Core MVP
   - behavior produk
   - acceptance criteria
3. `frontend/autosup-complete.md`
   - visi produk
   - design prompts
   - framing UX (saat behavior tidak diatur eksplisit di PRD)
4. `frontend/CLAUDE.md`
   - tech stack
   - coding conventions
   - UI and data guardrails

Jika ada konflik:
- API contract menang untuk kontrak data
- PRD menang untuk keputusan scope dan behavior produk
- autosup-complete.md menang untuk visi & framing UX
- CLAUDE menang untuk preferensi implementasi frontend

## 3. Workflow Agent

Gunakan workflow default ini:

`discover -> align -> implement -> validate -> handoff`

### Discover
- Baca task user dengan teliti
- Temukan file dan route yang relevan
- Cek `frontend/PRD.md` dan `api-contract.md` sebelum membuat asumsi
- Cek apakah task menyentuh role `supplier`, `distributor`, `retailer`, atau kombinasi

### Align
- Cocokkan task dengan scope Core MVP
- Tentukan apakah perubahan ini butuh data backend nyata atau bisa memakai mock
- Cek apakah ada dampak ke route, component reusable, state global, atau API helper

### Implement
- Kerjakan perubahan di scope sekecil yang masuk akal
- Ikuti konvensi di `frontend/CLAUDE.md`
- Jaga role-awareness, empty state, loading state, error state, dan happy path

### Validate
- Jalankan validasi yang relevan untuk perubahan yang dibuat
- Minimal pertimbangkan `npm run lint`
- Pertimbangkan `npm run build` untuk perubahan lintas route, App Router boundary, atau perubahan struktural

### Handoff
- Tutup tugas dengan ringkasan perubahan
- Sebut file utama yang disentuh
- Sebut verifikasi yang sudah dijalankan
- Sebut gap, asumsi, atau state yang belum tercakup bila ada

## 4. Task Intake Rules

Sebelum mulai coding, agent wajib memeriksa hal-hal berikut:
- Apakah fitur ini masuk Core MVP di `frontend/PRD.md`
- Role mana yang terdampak: `supplier`, `distributor`, `retailer`, atau kombinasi
- Endpoint dan response shape apa yang relevan di `api-contract.md`
- Apakah perubahan ini menyentuh:
  - route App Router
  - reusable components
  - hooks
  - global state
  - API helper

Jika task bisa diselesaikan dengan mengikuti source of truth yang ada, agent harus lanjut bekerja tanpa menunggu arahan tambahan.

## 5. Implementation Boundaries

Agent frontend tidak boleh:
- menciptakan endpoint backend baru tanpa instruksi eksplisit
- mengubah role yang sudah fixed:
  - `supplier`
  - `distributor`
  - `retailer`
- mengubah enum status yang sudah fixed:
  - inventory: `in_stock`, `low_stock`, `out_of_stock`
  - orders: `pending`, `processing`, `shipping`, `delivered`, `cancelled`
- membuat flow blockchain langsung dari browser tanpa instruksi eksplisit
- memindahkan fitur roadmap menjadi Core MVP tanpa keputusan produk baru
- mengubah kontrak API agar menyesuaikan UI

Agent frontend boleh:
- membuat mock data sementara jika backend belum siap
- membuat reusable UI components
- membuat API client, hooks, dan state management yang mengikuti kontrak yang sudah ada
- menambahkan loading, empty, error, dan success handling yang diperlukan untuk UX yang layak

## 6. Mock Data Rules

Jika backend belum siap:
- agent boleh memakai mock data
- bentuk mock harus tetap mengikuti `api-contract.md`
- naming role, status, dan response envelope tidak boleh diubah
- mock harus membantu transisi ke backend nyata, bukan membuat kontrak baru diam-diam

Jika bentuk data di API contract sudah jelas, agent harus lanjut mandiri dengan mock sementara tanpa menunggu definisi ulang dari user.

## 7. Validation Rules

Tooling yang dianggap tersedia dan relevan di repo ini (referensi lengkap tech stack ada di `frontend/CLAUDE.md`):
- Next.js 16+ App Router
- Tailwind CSS
- Shadcn/Radix
- Zustand (client-side global state)
- React Query (server state / data fetching)
- `npm run lint`
- `npm run build`

Aturan validasi:
- Untuk perubahan frontend biasa, agent minimal mempertimbangkan menjalankan `npm run lint`
- Untuk perubahan yang menyentuh route structure, server/client boundary, shared layout, atau wiring App Router, agent perlu mempertimbangkan `npm run build`
- Jika validasi tidak dijalankan, agent harus menyebutkannya secara eksplisit di handoff
- Jangan mengklaim sesuatu sudah terverifikasi jika command belum dijalankan

## 8. UI/UX Guardrails

Semua output frontend harus:
- role-aware untuk `supplier`, `distributor`, dan `retailer`
- terasa seperti dashboard operasional, bukan landing page
- menghindari `alert()`
- menyiapkan loading state
- menyiapkan empty state
- menyiapkan error state
- menyiapkan happy path state

Prinsip tambahan:
- CTA distributor tidak boleh muncul di workspace supplier/retailer
- action supplier tidak boleh muncul di workspace distributor/retailer
- distributor-only modules (Retailers CRM, Credit Line, Logistics) tidak boleh muncul di workspace retailer/supplier
- trust layer seperti partnership, escrow, dan reputation ditampilkan sebagai hasil sistem
- jangan memaksa wallet flow untuk use case MVP biasa

## 9. Stop Conditions dan Escalation

Agent harus pause dan meminta klarifikasi jika:
- isi `frontend/PRD.md` bertentangan dengan `api-contract.md`
- task meminta fitur yang jelas berada di luar Core MVP
- perubahan membutuhkan keputusan produk yang belum ada di dokumen
- ada lebih dari satu interpretasi yang akan mengubah behavior user secara signifikan

Agent harus lanjut mandiri jika:
- hanya butuh mock sementara dan shape data sudah jelas
- hanya perlu memilih struktur komponen, hooks, atau state yang masih berada dalam guardrails repo
- masalahnya murni implementasi frontend dan source of truth sudah cukup

## 10. Handoff Output

Saat selesai, agent harus melaporkan:
- apa yang berubah
- file utama yang disentuh
- verifikasi yang dijalankan atau belum dijalankan
- asumsi penting yang diambil
- area yang masih pending, jika ada

Handoff harus membantu engineer berikutnya lanjut tanpa menebak-nebak keputusan yang sudah diambil.

## 11. Pembagian Tanggung Jawab Dokumen

Gunakan pembagian ini agar instruksi tidak tercampur:

**`AGENTS.md`**
- workflow kerja
- boundaries
- stop conditions
- escalation
- handoff expectations

**`CLAUDE.md`**
- tech stack
- coding conventions
- implementation preferences
- data/UI guardrails yang lebih detail

Jika sebuah aturan lebih cocok sebagai cara bekerja agent, letakkan di `AGENTS.md`.
Jika sebuah aturan lebih cocok sebagai cara menulis dan menyusun implementasi, letakkan di `CLAUDE.md`.
