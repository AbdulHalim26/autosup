# AUTOSUP API Contract
> **Status:** Draft v1.0  
> **Last Updated:** 2025  
> **Maintainers:** Geral (FE + Smart Contract) · Halim (BE + AI)

---

## Konvensi Umum

### Base URL
```
Development : http://localhost:8000/api/v1
Production  : https://autosup-api.railway.app/api/v1
```

### Authentication
Semua endpoint (kecuali `/auth/*`) wajib kirim header:
```
Authorization: Bearer <supabase_jwt_token>
```

### Format Response Standar
Semua response mengikuti envelope ini:
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```
Jika error:
```json
{
  "success": false,
  "data": null,
  "message": "Deskripsi error",
  "error_code": "INVENTORY_NOT_FOUND"
}
```

### HTTP Status Code
| Code | Kapan dipakai |
|------|--------------|
| 200  | Success GET / PUT |
| 201  | Success POST (create) |
| 400  | Bad request / validasi gagal |
| 401  | Token tidak valid / expired |
| 403  | Tidak punya akses |
| 404  | Resource tidak ditemukan |
| 500  | Server error |

### Role User
| Role | Deskripsi |
|------|-----------|
| `supplier` | Punya produk, terima order dari distributor |
| `distributor` | Beli dari supplier, jual ke retailer |

---

## 1. Authentication

### POST `/auth/register`
Registrasi user baru.

**Request Body:**
```json
{
  "full_name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "min8chars",
  "role": "distributor",
  "business_name": "Toko Budi Jaya",
  "phone": "08123456789"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-xxx",
    "email": "budi@example.com",
    "role": "distributor",
    "access_token": "eyJ..."
  },
  "message": "Registrasi berhasil"
}
```

---

### POST `/auth/login`
Login user. Dilindungi Google reCAPTCHA v3 — FE wajib kirim `recaptcha_token` di setiap request.

> **Alur reCAPTCHA v3 (invisible):**
> 1. FE load script reCAPTCHA dari Google
> 2. FE execute `grecaptcha.execute(SITE_KEY, { action: 'login' })` → dapat token
> 3. FE kirim token ke BE via field `recaptcha_token`
> 4. BE verifikasi token ke Google API → dapat `score` (0.0–1.0)
> 5. Jika `score < 0.5` → tolak login, return 403

**Request Body:**
```json
{
  "email": "budi@example.com",
  "password": "min8chars",
  "recaptcha_token": "03AGdBq25SxXT..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-xxx",
    "full_name": "Budi Santoso",
    "role": "distributor",
    "business_name": "Toko Budi Jaya",
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "Login berhasil"
}
```

**Response 403 (bot terdeteksi):**
```json
{
  "success": false,
  "data": null,
  "message": "Verifikasi gagal, terdeteksi aktivitas mencurigakan",
  "error_code": "CAPTCHA_FAILED"
}
```

**Response 400 (token tidak dikirim):**
```json
{
  "success": false,
  "data": null,
  "message": "recaptcha_token wajib diisi",
  "error_code": "CAPTCHA_MISSING"
}
```

> **Catatan untuk Halim (BE):**
> - Simpan `RECAPTCHA_SECRET_KEY` di environment variable, jangan di-hardcode
> - Verifikasi ke: `POST https://www.google.com/recaptcha/api/siteverify`
> - Payload: `secret=SECRET_KEY&response=recaptcha_token`
> - Threshold score: `>= 0.5` dianggap manusia, `< 0.5` ditolak
> - Selalu verifikasi `action == "login"` dari response Google untuk mencegah token reuse

> **Catatan untuk Geral (FE):**
> - Daftarkan domain di [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
> - Simpan `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` di `.env.local`
> - Token expired dalam 2 menit — generate ulang tiap kali user klik tombol Login
> - Jangan tampilkan error teknis ke user, cukup: "Verifikasi gagal, coba lagi"

---

### POST `/auth/refresh`
Refresh access token.

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ..."
  },
  "message": "Token diperbarui"
}
```

---

## 2. Inventory

### GET `/inventory`
Ambil semua item inventaris milik user yang login.

**Query Params (opsional):**
```
?status=low_stock         → filter by status
?category=bahan_baku      → filter by kategori
?search=tepung            → search by nama
?page=1&limit=20          → pagination
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item-uuid-001",
        "name": "Tepung Terigu",
        "category": "bahan_baku",
        "stock": 15,
        "min_stock": 50,
        "unit": "kg",
        "status": "low_stock",
        "last_updated": "2025-07-10T08:30:00Z"
      },
      {
        "id": "item-uuid-002",
        "name": "Gula Pasir",
        "category": "bahan_baku",
        "stock": 200,
        "min_stock": 100,
        "unit": "kg",
        "status": "in_stock",
        "last_updated": "2025-07-09T14:00:00Z"
      }
    ],
    "summary": {
      "total_items": 24,
      "low_stock_count": 3,
      "out_of_stock_count": 1
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 24
    }
  },
  "message": "OK"
}
```

**Status enum:**
| Value | Kondisi |
|-------|---------|
| `in_stock` | `stock >= min_stock` |
| `low_stock` | `0 < stock < min_stock` |
| `out_of_stock` | `stock == 0` |

---

### POST `/inventory`
Tambah item baru ke inventaris.

**Request Body:**
```json
{
  "name": "Minyak Goreng",
  "category": "bahan_baku",
  "stock": 100,
  "min_stock": 30,
  "unit": "liter"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "item-uuid-003",
    "name": "Minyak Goreng",
    "category": "bahan_baku",
    "stock": 100,
    "min_stock": 30,
    "unit": "liter",
    "status": "in_stock",
    "last_updated": "2025-07-10T09:00:00Z"
  },
  "message": "Item berhasil ditambahkan"
}
```

---

### PUT `/inventory/{item_id}`
Update stok atau info item.

**Request Body (semua field opsional):**
```json
{
  "stock": 75,
  "min_stock": 30,
  "category": "bahan_baku"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "item-uuid-001",
    "name": "Tepung Terigu",
    "stock": 75,
    "min_stock": 30,
    "unit": "kg",
    "status": "in_stock",
    "last_updated": "2025-07-10T10:00:00Z"
  },
  "message": "Item berhasil diperbarui"
}
```

---

### DELETE `/inventory/{item_id}`
Hapus item dari inventaris.

**Response 200:**
```json
{
  "success": true,
  "data": null,
  "message": "Item berhasil dihapus"
}
```

---

## 3. AI Agent (Gemini-powered)

### POST `/ai/restock-recommendation`
Minta rekomendasi restock dari AI berdasarkan kondisi stok saat ini.

**Request Body:**
```json
{
  "item_id": "item-uuid-001"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "item_id": "item-uuid-001",
    "item_name": "Tepung Terigu",
    "current_stock": 15,
    "min_stock": 50,
    "recommendation": "Stok Tepung Terigu kamu tinggal 15 kg, jauh di bawah batas minimum 50 kg. Disarankan restock segera minimal 100 kg.",
    "suggested_qty": 100,
    "suggested_unit": "kg",
    "suggested_supplier": {
      "supplier_id": "supplier-uuid-001",
      "name": "CV Maju Bersama",
      "reputation_score": 92,
      "estimated_delivery_days": 2
    },
    "urgency": "high",
    "generated_at": "2025-07-10T10:05:00Z"
  },
  "message": "Rekomendasi berhasil dibuat"
}
```

**Urgency enum:**
| Value | Kondisi |
|-------|---------|
| `high` | `stock < 30% dari min_stock` |
| `medium` | `stock 30–70% dari min_stock` |
| `low` | `stock > 70% dari min_stock` |

---

### POST `/ai/demand-forecast`
Prediksi permintaan produk untuk periode ke depan.

**Request Body:**
```json
{
  "item_id": "item-uuid-001",
  "forecast_days": 7
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "item_id": "item-uuid-001",
    "item_name": "Tepung Terigu",
    "forecast_days": 7,
    "predicted_demand": 120,
    "unit": "kg",
    "confidence": "medium",
    "insight": "Berdasarkan pola pembelian 30 hari terakhir, permintaan Tepung Terigu cenderung meningkat di akhir pekan. Estimasi kebutuhan 7 hari ke depan adalah 120 kg.",
    "generated_at": "2025-07-10T10:10:00Z"
  },
  "message": "Forecast berhasil dibuat"
}
```

---

### POST `/ai/credit-risk`
> Role: `distributor` only

Analisis risiko kredit untuk retailer.

**Request Body:**
```json
{
  "retailer_id": "retailer-uuid-001"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "retailer_id": "retailer-uuid-001",
    "retailer_name": "Toko Sumber Rejeki",
    "risk_score": 72,
    "risk_level": "low",
    "recommendation": "Retailer ini memiliki histori pembayaran yang konsisten dalam 3 bulan terakhir. Aman untuk diberikan kredit hingga Rp 10.000.000.",
    "max_credit_suggestion": 10000000,
    "generated_at": "2025-07-10T10:15:00Z"
  },
  "message": "Analisis risiko berhasil"
}
```

**Risk level enum:** `low` · `medium` · `high`

---

## 4. Supplier

### GET `/suppliers`
Ambil daftar supplier.

**Query Params:**
```
?type=partner         → "partner" | "discover"
?search=maju          → search nama supplier
?page=1&limit=10
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "suppliers": [
      {
        "supplier_id": "supplier-uuid-001",
        "name": "CV Maju Bersama",
        "category": "bahan_makanan",
        "type": "partner",
        "reputation_score": 92,
        "total_transactions": 48,
        "on_time_delivery_rate": 95,
        "wallet_address": "So1ana...xyz",
        "is_active": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15
    }
  },
  "message": "OK"
}
```

---

### POST `/suppliers/partnership-request`
Kirim permintaan kemitraan ke supplier (lalu trigger mint Partnership NFT di backend).

**Request Body:**
```json
{
  "supplier_id": "supplier-uuid-002"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "request_id": "req-uuid-001",
    "supplier_id": "supplier-uuid-002",
    "supplier_name": "PT Sejahtera Abadi",
    "status": "pending",
    "created_at": "2025-07-10T11:00:00Z"
  },
  "message": "Permintaan kemitraan dikirim"
}
```

---

### PUT `/suppliers/partnership-request/{request_id}`
> Role: `supplier` — accept atau reject permintaan.

**Request Body:**
```json
{
  "action": "accept"
}
```
`action` enum: `accept` · `reject`

**Response 200 (jika accept):**
```json
{
  "success": true,
  "data": {
    "request_id": "req-uuid-001",
    "status": "accepted",
    "partnership_nft": {
      "mint_address": "So1ana...abc",
      "tx_signature": "5xYz...",
      "minted_at": "2025-07-10T11:05:00Z"
    }
  },
  "message": "Kemitraan diterima dan NFT berhasil di-mint"
}
```

> **Catatan untuk Halim:** Saat `action = "accept"`, BE harus memanggil Solana RPC untuk mint SBT. Response `partnership_nft` bisa bernilai `null` jika mint gagal — FE akan handle dengan retry.

---

## 5. Orders

### GET `/orders`
Ambil daftar order.

**Query Params:**
```
?status=pending       → filter status
?role=buyer           → "buyer" | "seller"
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "order_id": "order-uuid-001",
        "order_number": "ORD-2025-001",
        "buyer": {
          "id": "user-uuid-xxx",
          "name": "Toko Budi Jaya",
          "role": "distributor"
        },
        "seller": {
          "id": "supplier-uuid-001",
          "name": "CV Maju Bersama",
          "role": "supplier"
        },
        "items": [
          {
            "item_name": "Tepung Terigu",
            "qty": 100,
            "unit": "kg",
            "price_per_unit": 12000,
            "subtotal": 1200000
          }
        ],
        "total_amount": 1200000,
        "status": "processing",
        "delivery_address": "Jl. Merdeka No.10, Jakarta",
        "estimated_delivery": "2025-07-12",
        "created_at": "2025-07-10T09:00:00Z",
        "updated_at": "2025-07-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8
    }
  },
  "message": "OK"
}
```

**Status enum:**
| Value | Deskripsi |
|-------|-----------|
| `pending` | Order dibuat, belum diproses supplier |
| `processing` | Supplier sedang memproses |
| `shipping` | Barang dalam pengiriman |
| `delivered` | Barang diterima — trigger escrow release |
| `cancelled` | Order dibatalkan |

---

### POST `/orders`
Buat order baru.

**Request Body:**
```json
{
  "supplier_id": "supplier-uuid-001",
  "items": [
    {
      "item_name": "Tepung Terigu",
      "qty": 100,
      "unit": "kg",
      "price_per_unit": 12000
    }
  ],
  "delivery_address": "Jl. Merdeka No.10, Jakarta",
  "notes": "Tolong dibungkus rapi"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid-002",
    "order_number": "ORD-2025-002",
    "total_amount": 1200000,
    "status": "pending",
    "escrow_status": "held",
    "created_at": "2025-07-10T11:30:00Z"
  },
  "message": "Order berhasil dibuat"
}
```

---

### PUT `/orders/{order_id}/status`
Update status order.

**Request Body:**
```json
{
  "status": "shipping"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid-001",
    "status": "shipping",
    "updated_at": "2025-07-10T12:00:00Z"
  },
  "message": "Status order diperbarui"
}
```

> **Catatan:** Jika status berubah ke `delivered`, BE otomatis trigger:
> 1. Release escrow ke supplier
> 2. Update reputation score supplier di blockchain

---

## 6. Dashboard Summary

### GET `/dashboard/summary`
Ambil data ringkasan untuk halaman dashboard (1 endpoint, FE tidak perlu banyak request).

**Response 200 (role: distributor):**
```json
{
  "success": true,
  "data": {
    "inventory": {
      "total_items": 24,
      "low_stock_count": 3,
      "out_of_stock_count": 1
    },
    "orders": {
      "active_orders": 5,
      "pending_orders": 2,
      "completed_this_month": 18
    },
    "suppliers": {
      "partner_count": 8,
      "pending_requests": 1
    },
    "ai_insights": [
      {
        "type": "restock_alert",
        "message": "Tepung Terigu hampir habis. Disarankan restock 100 kg dari CV Maju Bersama.",
        "urgency": "high",
        "item_id": "item-uuid-001"
      },
      {
        "type": "demand_forecast",
        "message": "Permintaan Gula Pasir diprediksi naik 20% minggu depan.",
        "urgency": "medium",
        "item_id": "item-uuid-002"
      }
    ]
  },
  "message": "OK"
}
```

---

## 7. Blockchain (Solana — dikerjain Geral)

Endpoint ini dipanggil **oleh backend Halim** saat butuh interaksi on-chain. FE tidak memanggil langsung.

### POST `/blockchain/mint-partnership-nft`
Mint Soulbound Token untuk kemitraan yang disetujui.

**Request Body:**
```json
{
  "distributor_wallet": "So1ana...abc",
  "supplier_wallet": "So1ana...xyz",
  "partnership_data": {
    "distributor_id": "user-uuid-xxx",
    "supplier_id": "supplier-uuid-001",
    "agreed_at": "2025-07-10T11:05:00Z"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "mint_address": "So1ana...nft",
    "tx_signature": "5xYz...",
    "explorer_url": "https://explorer.solana.com/tx/5xYz...?cluster=devnet"
  },
  "message": "Partnership NFT berhasil di-mint"
}
```

---

### POST `/blockchain/update-reputation`
Update skor reputasi supplier on-chain setelah order selesai.

**Request Body:**
```json
{
  "supplier_wallet": "So1ana...xyz",
  "order_id": "order-uuid-001",
  "event": "on_time_delivery"
}
```

**Event enum:**
| Value | Efek pada skor |
|-------|---------------|
| `on_time_delivery` | +5 poin |
| `late_delivery` | -3 poin |
| `dispute` | -10 poin |
| `successful_transaction` | +2 poin |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "supplier_wallet": "So1ana...xyz",
    "old_score": 87,
    "new_score": 92,
    "tx_signature": "7aBC...",
    "updated_at": "2025-07-10T13:00:00Z"
  },
  "message": "Reputasi supplier diperbarui"
}
```

---

### GET `/blockchain/reputation/{wallet_address}`
Ambil skor reputasi supplier dari on-chain.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "wallet_address": "So1ana...xyz",
    "reputation_score": 92,
    "total_transactions": 48,
    "on_time_delivery_rate": 95,
    "last_updated": "2025-07-10T13:00:00Z"
  },
  "message": "OK"
}
```

---

## Catatan Penting untuk Tim

### Untuk Halim (BE)
- Semua endpoint yang belum selesai, buat **mock response dulu** agar Geral bisa lanjut FE
- Saat `POST /suppliers/partnership-request` di-accept, panggil endpoint `/blockchain/mint-partnership-nft` secara internal
- Saat `PUT /orders/{id}/status` berubah jadi `delivered`, panggil `/blockchain/update-reputation` secara internal
- Gemini response harus selalu dalam format JSON — gunakan `response_mime_type: "application/json"` di SDK

### Untuk Geral (FE)
- Gunakan mock data lokal (`/mocks/*.json`) selama BE belum siap
- Semua API call di-wrap dalam custom hook (`useInventory`, `useOrders`, dst.)
- Error dari API ditampilkan via toast notification — jangan alert()
- Wallet address hanya dibutuhkan di fitur Partnership NFT — jangan block user yang belum connect wallet

### Untuk Alan (UI/UX)
- Komponen yang paling dibutuhkan untuk coding pertama: Dashboard, InventoryTable, StatusBadge, AIInsightCard
- Gunakan color system dari dokumen: navy `#0F172A`, blue `#3B82F6`, green `#22C55E`, orange `#F59E0B`, red `#EF4444`

---

*Document ini hidup — update setiap ada perubahan dan notify tim di grup.*