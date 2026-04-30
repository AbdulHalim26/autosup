# AUTOSUP API Contract
> **Status:** Draft v3.0
> **Last Updated:** 2026-04
> **Maintainers:** Geral (FE + Smart Contract) · Halim (BE + AI)
>
> **Scope note:** v3.0 menyamakan scope dengan `frontend/autosup-complete.md` — semua fitur per role di §5 dan §8/§9 dianggap Core MVP. **Retailer naik jadi role login penuh** (sebelumnya entity-only). Endpoint untuk Retailers (distributor CRM), Credit, Payment, Logistics, Analytics, AI Agents, Settings di-draft di v2.0 dan menunggu implementasi BE. Retailer-as-login me-reuse endpoint role-aware yang sama dengan filter berdasarkan auth context.

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
| `supplier` | Punya produk, terima order dari distributor (atau langsung dari retailer) |
| `distributor` | Beli dari supplier, jual ke retailer; manage credit line, payment, logistics |
| `retailer` | Bisnis end-user (kafe, restoran, bakery, retail UMKM) — beli stok dari distributor (atau langsung supplier) untuk operasional/dijual ke konsumen |

> **Catatan:** `retailer` (role login) ≠ `retailer` entity di `/retailers/*`. Endpoint `/retailers/*` adalah CRM distributor untuk manage retailer clients-nya. Retailer yang login pakai akun sendiri me-reuse endpoint generic role-aware (`/inventory`, `/orders`, `/suppliers`, `/payments`, `/settings`, `/analytics/*`, `/ai/*`).

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

**Role enum:** `supplier` · `distributor` · `retailer`

> **Catatan:** Untuk `role: "retailer"`, `business_name` umumnya nama outlet/bisnis end-user (cth: "Kafe Senja", "Bakery Mawar"). Pasca-register, retailer diarahkan ke dashboard role-aware sendiri.

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

### POST `/auth/logout`
Logout user dan invalidate refresh token.

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
  "data": null,
  "message": "Logout berhasil"
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
> **Scope:** Core MVP

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
> **Scope:** Core MVP (v2.0)

Prediksi permintaan produk untuk periode ke depan. Dipakai di Demand Intelligence (supplier) dan Demand Forecast Analytics (distributor dashboard).

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
> **Scope:** Core MVP (v2.0)
> Role: `distributor` only

Analisis risiko kredit untuk retailer. Dipakai sebelum approve credit line dan di Risk Monitoring panel.

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

### GET `/suppliers/partnership-requests`
> Role: `supplier` — ambil daftar partnership request yang masuk.

**Query Params (opsional):**
```
?status=pending           → "pending" | "accepted" | "rejected"
?page=1&limit=10
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "request_id": "req-uuid-001",
        "distributor": {
          "id": "user-uuid-xxx",
          "name": "Toko Budi Jaya",
          "business_name": "Toko Budi Jaya"
        },
        "status": "pending",
        "created_at": "2025-07-10T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3
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

### GET `/suppliers/{supplier_id}/stock`
> Role: `distributor` only — supplier_id wajib partner aktif.

Ambil daftar produk supplier beserta visibilitas stok untuk perencanaan order.

**Query Params (opsional):**
```
?status=in_stock       → filter status stok
?search=tepung
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "supplier": {
      "supplier_id": "supplier-uuid-001",
      "name": "CV Maju Bersama",
      "is_partner": true
    },
    "products": [
      {
        "item_id": "item-supplier-001",
        "name": "Tepung Terigu",
        "category": "bahan_baku",
        "stock": 850,
        "min_stock": 200,
        "unit": "kg",
        "status": "in_stock",
        "estimated_restock_days": null,
        "last_updated": "2026-04-28T10:00:00Z"
      },
      {
        "item_id": "item-supplier-002",
        "name": "Gula Pasir",
        "category": "bahan_baku",
        "stock": 30,
        "min_stock": 100,
        "unit": "kg",
        "status": "low_stock",
        "estimated_restock_days": 3,
        "last_updated": "2026-04-28T09:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12
    }
  },
  "message": "OK"
}
```

**Response 403 (bukan partner):**
```json
{
  "success": false,
  "data": null,
  "message": "Anda belum menjadi partner supplier ini",
  "error_code": "SUPPLIER_NOT_PARTNER"
}
```

---

## 5. Orders

> **Schema generic (buyer/seller).** Filter `?role=buyer` valid untuk semua role:
> - `distributor` sebagai buyer → seller = `supplier`
> - `retailer` sebagai buyer → seller = `distributor` (atau `supplier` jika beli langsung)
> - `supplier` sebagai seller → buyer = `distributor` (atau `retailer`)
>
> BE menentukan visibility & filter berdasarkan auth context.

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

**Escrow status enum:**
| Value | Kondisi |
|-------|---------|
| `held` | Dana ditahan menunggu delivery |
| `released` | Dana dilepas ke supplier setelah status `delivered` |
| `refunded` | Dana dikembalikan ke buyer setelah status `cancelled` |

---

### GET `/orders/{order_id}`
Ambil detail satu order.

**Response 200:**
```json
{
  "success": true,
  "data": {
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
    "escrow_status": "held",
    "delivery_address": "Jl. Merdeka No.10, Jakarta",
    "notes": "Tolong dibungkus rapi",
    "estimated_delivery": "2025-07-12",
    "status_history": [
      { "status": "pending", "changed_at": "2025-07-10T09:00:00Z" },
      { "status": "processing", "changed_at": "2025-07-10T10:00:00Z" }
    ],
    "created_at": "2025-07-10T09:00:00Z",
    "updated_at": "2025-07-10T10:00:00Z"
  },
  "message": "OK"
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
      "out_of_stock_count": 1,
      "warehouse_utilization_rate": 0.72,
      "fast_moving_count": 5
    },
    "orders": {
      "active_orders": 5,
      "pending_orders": 2,
      "completed_this_month": 18,
      "delayed_count": 1
    },
    "suppliers": {
      "partner_count": 8,
      "pending_requests": 1,
      "average_reliability_score": 88
    },
    "retailers": {
      "active_count": 22,
      "high_risk_count": 2,
      "monthly_order_volume": 156
    },
    "credit": {
      "total_issued": 45000000,
      "active_accounts": 9,
      "overdue_count": 1,
      "outstanding_balance": 12500000
    },
    "payment": {
      "incoming_pending": 4,
      "supplier_settlement_pending": 3,
      "collection_rate": 0.92
    },
    "logistics": {
      "active_shipments": 6,
      "on_time_rate": 0.94,
      "delayed_count": 1
    },
    "analytics_quick_stats": {
      "revenue_growth_pct": 12.5,
      "fulfillment_rate": 0.96,
      "inventory_turnover": 3.4,
      "demand_forecast_accuracy": 0.87
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
      },
      {
        "type": "credit_risk",
        "message": "Retailer Toko Sumber Rejeki masuk medium risk; pertimbangkan adjust limit.",
        "urgency": "medium",
        "retailer_id": "retailer-uuid-001"
      },
      {
        "type": "logistics_optimization",
        "message": "Reroute Shipment #D-203 untuk mengurangi delay 18% akibat congestion.",
        "urgency": "medium",
        "shipment_id": "shipment-uuid-203"
      }
    ]
  },
  "message": "OK"
}
```

**Response 200 (role: supplier):**
```json
{
  "success": true,
  "data": {
    "products": {
      "total_active": 45,
      "low_stock_count": 2,
      "out_of_stock_count": 0,
      "high_demand_count": 3
    },
    "orders": {
      "incoming_orders": 12,
      "processing": 5,
      "completed_this_month": 30,
      "average_processing_hours": 8
    },
    "partners": {
      "distributor_count": 15,
      "pending_requests": 3
    },
    "demand_intelligence": {
      "demand_growth_pct": 18,
      "peak_day": "Friday",
      "comparison_period": "weekly"
    },
    "top_products": [
      {
        "item_id": "item-uuid-001",
        "name": "Tepung Terigu",
        "demand_volume": 1800,
        "growth_pct": 25,
        "trend": "up"
      },
      {
        "item_id": "item-uuid-002",
        "name": "Gula Pasir",
        "demand_volume": 1200,
        "growth_pct": -5,
        "trend": "down"
      }
    ],
    "geo_demand_summary": {
      "top_regions": [
        { "region": "Jakarta", "demand_score": 92 },
        { "region": "Surabaya", "demand_score": 78 }
      ]
    },
    "analytics_quick_stats": {
      "total_revenue": 145000000,
      "fulfillment_rate": 0.95,
      "active_distributor_contribution_pct": 84
    },
    "ai_insights": [
      {
        "type": "demand_alert",
        "message": "Permintaan Tepung Terigu meningkat 20% minggu ini dari distributor partner.",
        "urgency": "medium",
        "item_id": "item-uuid-001"
      },
      {
        "type": "production_recommendation",
        "message": "Disarankan menaikkan produksi Gula 10% minggu depan.",
        "urgency": "low",
        "item_id": "item-uuid-002"
      }
    ]
  },
  "message": "OK"
}
```

**Response 200 (role: retailer):**
```json
{
  "success": true,
  "data": {
    "inventory": {
      "total_items": 38,
      "low_stock_count": 4,
      "out_of_stock_count": 1,
      "inventory_value": 12500000,
      "restock_priority_count": 3
    },
    "orders": {
      "active_orders": 6,
      "pending_approval": 2,
      "in_transit": 3,
      "completed_this_month": 21,
      "order_accuracy_rate": 0.97
    },
    "spending": {
      "total_outstanding": 4200000,
      "monthly_spending": 18500000,
      "available_credit": 6800000,
      "upcoming_due_payments": 2,
      "payment_success_rate": 0.96
    },
    "suppliers": {
      "active_partnered": 5,
      "pending_requests": 1,
      "average_reliability_score": 89,
      "avg_delivery_time_hours": 28
    },
    "forecast_accuracy_pct": 0.84,
    "ai_insights": [
      {
        "type": "restock_alert",
        "message": "Stok Susu UHT tinggal 12 botol. Restock 60 botol dari Distributor A.",
        "urgency": "high",
        "item_id": "item-uuid-201"
      },
      {
        "type": "purchasing_optimization",
        "message": "Gabungkan order detergen + minuman minggu depan untuk hemat ongkir 12%.",
        "urgency": "medium"
      },
      {
        "type": "cash_flow_recommendation",
        "message": "Tunda pembayaran non-essential 3 hari untuk jaga saldo operasional sehat.",
        "urgency": "low"
      }
    ]
  },
  "message": "OK"
}
```

**AI insight `type` enum (gabungan):**
| Value | Audience | Deskripsi |
|-------|----------|-----------|
| `restock_alert` | distributor, retailer | Item low/out of stock |
| `demand_forecast` | distributor, supplier, retailer | Prediksi permintaan |
| `demand_alert` | supplier | Spike demand pada produk |
| `credit_risk` | distributor | Risk warning retailer client |
| `logistics_optimization` | distributor | Reroute / optimize delivery |
| `supplier_recommendation` | distributor, retailer | Saran procurement shift / vendor match |
| `production_recommendation` | supplier | Saran adjust produksi |
| `purchasing_optimization` | retailer | Saran kombinasi order untuk hemat biaya |
| `cash_flow_recommendation` | retailer | Saran timing pembayaran untuk jaga likuiditas |

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

### GET `/blockchain/escrow/{order_id}`
> Dipanggil FE untuk surface escrow status di Order Detail dan Payment page.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid-001",
    "escrow_status": "held",
    "amount": 1200000,
    "currency": "IDR",
    "held_at": "2025-07-10T11:30:00Z",
    "released_at": null,
    "tx_signature": "5xYz...",
    "explorer_url": "https://explorer.solana.com/tx/5xYz...?cluster=devnet"
  },
  "message": "OK"
}
```

**Escrow status enum:** `held` · `released` · `refunded`

---

### GET `/blockchain/partnership-nft/{distributor_id}/{supplier_id}`
> Dipanggil FE untuk fetch NFT metadata partnership.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "distributor_id": "user-uuid-xxx",
    "supplier_id": "supplier-uuid-001",
    "mint_address": "So1ana...nft",
    "tx_signature": "5xYz...",
    "explorer_url": "https://explorer.solana.com/tx/5xYz...?cluster=devnet",
    "minted_at": "2025-07-10T11:05:00Z",
    "status": "minted"
  },
  "message": "OK"
}
```

**Partnership NFT status enum:** `pending` · `minted` · `failed`

---

## 8. Retailers (Distributor CRM)
> **Scope:** Core MVP (v2.0) · Role: `distributor`
>
> **Penting:** Endpoint `/retailers/*` di section ini adalah **distributor-side CRM** untuk manage retailer clients yang ditarget distributor. Ini ≠ retailer-as-login. Untuk retailer yang punya akun & dashboard sendiri, mereka me-reuse endpoint role-aware seperti `/inventory`, `/orders`, `/suppliers`, `/payments`, `/settings`, `/analytics/*`, `/ai/*` (BE filter berdasarkan auth context).

### GET `/retailers`
Ambil daftar retailer milik distributor yang login.

**Query Params:**
```
?segment=premium       → "premium" | "regular" | "new"
?status=active         → "active" | "inactive" | "high_risk"
?search=sumber
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "retailers": [
      {
        "retailer_id": "retailer-uuid-001",
        "name": "Toko Sumber Rejeki",
        "contact_person": "Ibu Sari",
        "phone": "08123456789",
        "city": "Jakarta",
        "segment": "premium",
        "status": "active",
        "monthly_order_volume": 12,
        "total_purchase_amount": 25000000,
        "last_order_at": "2026-04-25T14:00:00Z"
      }
    ],
    "summary": {
      "total_active": 22,
      "high_risk_count": 2,
      "retention_rate": 0.91
    },
    "pagination": { "page": 1, "limit": 20, "total": 22 }
  },
  "message": "OK"
}
```

**Segment enum:** `premium` · `regular` · `new`  
**Status enum:** `active` · `inactive` · `high_risk`

---

### POST `/retailers`
Tambah retailer baru.

**Request Body:**
```json
{
  "name": "Toko Sumber Rejeki",
  "contact_person": "Ibu Sari",
  "phone": "08123456789",
  "email": "sari@example.com",
  "city": "Jakarta",
  "address": "Jl. Mawar No.5",
  "segment": "regular"
}
```

**Response 201:** Sama shape dengan item retailer di list.

---

### GET `/retailers/{retailer_id}`
Detail retailer + purchase history + demand intelligence ringkas.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "retailer_id": "retailer-uuid-001",
    "name": "Toko Sumber Rejeki",
    "contact_person": "Ibu Sari",
    "phone": "08123456789",
    "email": "sari@example.com",
    "city": "Jakarta",
    "address": "Jl. Mawar No.5",
    "segment": "premium",
    "status": "active",
    "purchase_history": [
      {
        "order_id": "order-uuid-010",
        "order_number": "ORD-2026-010",
        "total_amount": 2400000,
        "status": "delivered",
        "created_at": "2026-04-25T14:00:00Z"
      }
    ],
    "demand_intelligence": {
      "top_products": [
        { "item_name": "Tepung Terigu", "qty_last_30d": 80, "unit": "kg" }
      ],
      "order_frequency_per_month": 12,
      "forecast_growth_pct": 18
    },
    "credit_summary": {
      "has_active_credit": true,
      "credit_limit": 10000000,
      "outstanding_balance": 3200000,
      "risk_level": "low"
    }
  },
  "message": "OK"
}
```

---

### PUT `/retailers/{retailer_id}`
Update retailer.

**Request Body (semua field opsional):**
```json
{
  "phone": "08987654321",
  "segment": "premium",
  "status": "active"
}
```

**Response 200:** Updated retailer (shape sama dengan list item).

---

## 9. Credit Line (Distributor only)
> **Scope:** Core MVP (v2.0) · Role: `distributor`
>
> **Catatan:** Endpoint ini adalah **distributor perspective** (give credit ke retailer clients). Retailer perspective: lihat `available_credit` di field dashboard `spending` dan riwayat repayment di `/payments`.

### GET `/credit/accounts`
Ambil daftar credit account aktif untuk retailer.

**Query Params:**
```
?status=active        → "active" | "overdue" | "suspended" | "closed"
?retailer_id=
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "credit_account_id": "credit-uuid-001",
        "retailer": {
          "id": "retailer-uuid-001",
          "name": "Toko Sumber Rejeki"
        },
        "credit_limit": 10000000,
        "utilized_amount": 3200000,
        "available_amount": 6800000,
        "utilization_pct": 32,
        "status": "active",
        "risk_level": "low",
        "next_due_date": "2026-05-10",
        "next_due_amount": 1500000,
        "opened_at": "2026-01-15T08:00:00Z"
      }
    ],
    "summary": {
      "total_issued": 45000000,
      "outstanding_balance": 12500000,
      "overdue_count": 1,
      "repayment_success_rate": 0.93
    },
    "pagination": { "page": 1, "limit": 20, "total": 9 }
  },
  "message": "OK"
}
```

**Status enum:** `active` · `overdue` · `suspended` · `closed`  
**Risk level enum:** `low` · `medium` · `high`

---

### POST `/credit/accounts`
Buka credit line baru untuk retailer. FE disarankan memanggil `POST /ai/credit-risk` sebelum memanggil endpoint ini, lalu sertakan hasil risk score sebagai konteks decision.

**Request Body:**
```json
{
  "retailer_id": "retailer-uuid-001",
  "credit_limit": 10000000,
  "billing_cycle_days": 30,
  "notes": "Approved based on AI risk score 78 (low)"
}
```

**Response 201:** Credit account object (shape sama dengan list item).

---

### PUT `/credit/accounts/{credit_account_id}`
Adjust credit limit atau status.

**Request Body (semua field opsional):**
```json
{
  "credit_limit": 8500000,
  "status": "suspended"
}
```

**Response 200:** Updated credit account.

---

### GET `/credit/accounts/{credit_account_id}/repayments`
Riwayat pembayaran credit account.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "repayments": [
      {
        "repayment_id": "rep-uuid-001",
        "amount": 1500000,
        "paid_at": "2026-04-10T09:00:00Z",
        "status": "paid",
        "payment_method": "bank_transfer",
        "invoice_id": "inv-uuid-010"
      }
    ],
    "summary": {
      "total_paid": 22000000,
      "average_days_late": 1.2,
      "missed_count": 0
    }
  },
  "message": "OK"
}
```

**Repayment status enum:** `paid` · `overdue` · `partial` · `failed`

---

## 10. Payment (Distributor & Supplier)
> **Scope:** Core MVP (v2.0)
>
> Pembayaran end-user pakai IDR via Xendit/Midtrans. Escrow di-track di backend (Solana devnet) dan di-surface di Payment + Order Detail.

### GET `/payments`
List transaksi.

**Query Params:**
```
?direction=incoming      → "incoming" | "outgoing"
?status=paid             → enum payment status
?from=2026-04-01&to=2026-04-30
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "payment_id": "pay-uuid-001",
        "direction": "incoming",
        "counterparty": {
          "id": "retailer-uuid-001",
          "name": "Toko Sumber Rejeki",
          "type": "retailer"
        },
        "amount": 2400000,
        "currency": "IDR",
        "status": "paid",
        "method": "bank_transfer",
        "related_order_id": "order-uuid-010",
        "invoice_id": "inv-uuid-010",
        "paid_at": "2026-04-25T16:00:00Z",
        "created_at": "2026-04-25T14:00:00Z"
      }
    ],
    "summary": {
      "total_incoming": 24000000,
      "total_outgoing": 18000000,
      "pending_count": 4,
      "collection_rate": 0.92
    },
    "pagination": { "page": 1, "limit": 20, "total": 35 }
  },
  "message": "OK"
}
```

**Payment status enum:** `pending` · `paid` · `partial` · `failed` · `refunded`  
**Direction enum:** `incoming` (dari retailer ke distributor / dari distributor ke supplier) · `outgoing` (settlement supplier)  
**Method enum:** `bank_transfer` · `e_wallet` · `credit_line` · `escrow_release`  
**Counterparty type enum:** `retailer` · `distributor` · `supplier`

---

### GET `/payments/{payment_id}`
Detail transaksi + escrow status + blockchain verification.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay-uuid-001",
    "direction": "incoming",
    "counterparty": {
      "id": "retailer-uuid-001",
      "name": "Toko Sumber Rejeki",
      "type": "retailer"
    },
    "amount": 2400000,
    "currency": "IDR",
    "status": "paid",
    "method": "bank_transfer",
    "related_order_id": "order-uuid-010",
    "invoice_id": "inv-uuid-010",
    "escrow": {
      "escrow_status": "released",
      "tx_signature": "7aBC...",
      "explorer_url": "https://explorer.solana.com/tx/7aBC...?cluster=devnet"
    },
    "history": [
      { "status": "pending", "at": "2026-04-25T14:00:00Z" },
      { "status": "paid", "at": "2026-04-25T16:00:00Z" }
    ],
    "created_at": "2026-04-25T14:00:00Z"
  },
  "message": "OK"
}
```

---

### POST `/payments/settle`
Approve settlement ke supplier (release dana yang siap dilepas).

**Request Body:**
```json
{
  "order_id": "order-uuid-001"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay-uuid-002",
    "order_id": "order-uuid-001",
    "amount": 1200000,
    "status": "paid",
    "method": "escrow_release",
    "settled_at": "2026-04-28T17:00:00Z"
  },
  "message": "Settlement berhasil"
}
```

> **Catatan untuk Halim:** Endpoint ini idempotent terhadap `order_id` yang sama; jika sudah `released`, return existing payment record dengan status `paid`.

---

### GET `/invoices`
List invoice.

**Query Params:**
```
?status=pending          → "draft" | "sent" | "paid" | "overdue" | "cancelled"
?retailer_id=
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoice_id": "inv-uuid-010",
        "invoice_number": "INV-2026-010",
        "retailer": {
          "id": "retailer-uuid-001",
          "name": "Toko Sumber Rejeki"
        },
        "related_order_id": "order-uuid-010",
        "amount": 2400000,
        "status": "paid",
        "due_date": "2026-05-10",
        "issued_at": "2026-04-25T14:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 18 }
  },
  "message": "OK"
}
```

**Invoice status enum:** `draft` · `sent` · `paid` · `overdue` · `cancelled`

---

### POST `/invoices`
Generate invoice baru (umumnya dari order yang sudah `delivered`).

**Request Body:**
```json
{
  "retailer_id": "retailer-uuid-001",
  "related_order_id": "order-uuid-010",
  "amount": 2400000,
  "due_date": "2026-05-10",
  "notes": "Pembayaran transfer rekening BCA"
}
```

**Response 201:** Invoice object.

---

## 11. Logistics (Distributor)
> **Scope:** Core MVP (v2.0) · Role: `distributor`

### GET `/logistics/shipments`
List shipment aktif & historis.

**Query Params:**
```
?status=in_transit       → enum shipment status
?carrier_id=
?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "shipments": [
      {
        "shipment_id": "shipment-uuid-001",
        "shipment_number": "SHP-2026-001",
        "related_order_id": "order-uuid-010",
        "carrier": {
          "id": "carrier-uuid-001",
          "name": "JNE Trucking"
        },
        "origin": "Gudang Jakarta",
        "destination": "Toko Sumber Rejeki, Bandung",
        "status": "in_transit",
        "estimated_arrival": "2026-04-30T14:00:00Z",
        "last_updated_location": "Cikampek",
        "is_delayed": false,
        "created_at": "2026-04-28T08:00:00Z"
      }
    ],
    "summary": {
      "active_count": 6,
      "on_time_rate": 0.94,
      "delayed_count": 1
    },
    "pagination": { "page": 1, "limit": 20, "total": 6 }
  },
  "message": "OK"
}
```

**Shipment status enum:** `packed` · `dispatched` · `in_transit` · `delivered` · `delayed` · `failed`

---

### GET `/logistics/shipments/{shipment_id}`
Detail + timeline + carrier info.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "shipment_id": "shipment-uuid-001",
    "shipment_number": "SHP-2026-001",
    "related_order_id": "order-uuid-010",
    "carrier": {
      "id": "carrier-uuid-001",
      "name": "JNE Trucking",
      "reliability_score": 91
    },
    "origin": "Gudang Jakarta",
    "destination": "Toko Sumber Rejeki, Bandung",
    "status": "in_transit",
    "estimated_arrival": "2026-04-30T14:00:00Z",
    "is_delayed": false,
    "timeline": [
      { "stage": "packed", "at": "2026-04-28T08:00:00Z" },
      { "stage": "dispatched", "at": "2026-04-28T11:00:00Z" },
      { "stage": "in_transit", "at": "2026-04-29T07:00:00Z", "location": "Cikampek" }
    ],
    "ai_recommendation": {
      "type": "reroute",
      "message": "Reroute via tol layang untuk hindari congestion 18%",
      "confidence": "medium"
    }
  },
  "message": "OK"
}
```

---

### PUT `/logistics/shipments/{shipment_id}/route`
Assign carrier baru atau apply route optimization.

**Request Body:**
```json
{
  "carrier_id": "carrier-uuid-002",
  "apply_ai_recommendation": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "shipment_id": "shipment-uuid-001",
    "carrier": {
      "id": "carrier-uuid-002",
      "name": "Anteraja Express"
    },
    "estimated_arrival": "2026-04-30T11:30:00Z",
    "updated_at": "2026-04-29T09:00:00Z"
  },
  "message": "Route diperbarui"
}
```

---

### GET `/logistics/partners`
List logistics partner.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "partners": [
      {
        "carrier_id": "carrier-uuid-001",
        "name": "JNE Trucking",
        "reliability_score": 91,
        "active_shipments": 4,
        "monthly_capacity": 200,
        "contract_status": "active"
      }
    ]
  },
  "message": "OK"
}
```

**Contract status enum:** `active` · `expiring` · `expired` · `pending`

---

## 12. Analytics
> **Scope:** Core MVP (v2.0)

### GET `/analytics/distributor/overview`
> Role: `distributor`

**Query Params:**
```
?period=month            → "week" | "month" | "quarter"
?from=2026-04-01&to=2026-04-30
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "revenue_growth_pct": 12.5,
      "fulfillment_rate": 0.96,
      "inventory_turnover": 3.4,
      "supplier_performance_index": 88,
      "demand_forecast_accuracy": 0.87
    },
    "trends": {
      "revenue": [{ "label": "W1", "value": 12000000 }],
      "orders": [{ "label": "W1", "value": 22 }],
      "stock_movement": [{ "label": "W1", "value": 480 }]
    },
    "supply_chain_efficiency": {
      "delivery_speed_avg_hours": 30,
      "warehouse_utilization": 0.72,
      "stock_accuracy": 0.98,
      "procurement_cycle_days": 4
    },
    "ai_predictive": [
      {
        "message": "Diprediksi naik 14% retailer demand bulan depan, perluas stok di Region East",
        "confidence": "medium"
      }
    ]
  },
  "message": "OK"
}
```

---

### GET `/analytics/distributor/regional`
> Role: `distributor`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "region": "Jakarta",
        "demand_volume": 1280,
        "growth_pct": 14,
        "shipment_density": 92
      }
    ]
  },
  "message": "OK"
}
```

---

### GET `/analytics/supplier/overview`
> Role: `supplier`

**Query Params:** sama dengan distributor overview.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_revenue": 145000000,
      "demand_growth_pct": 18,
      "fulfillment_rate": 0.95,
      "active_distributor_contribution_pct": 84
    },
    "trends": {
      "revenue": [{ "label": "W1", "value": 32000000 }],
      "demand": [{ "label": "W1", "value": 1800 }],
      "orders": [{ "label": "W1", "value": 12 }],
      "fulfillment": [{ "label": "W1", "value": 0.96 }]
    },
    "distributor_performance": [
      {
        "distributor_id": "user-uuid-xxx",
        "name": "Toko Budi Jaya",
        "order_volume": 22,
        "revenue_contribution": 18000000,
        "fulfillment_success_rate": 0.97,
        "reliability_score": 88
      }
    ]
  },
  "message": "OK"
}
```

---

### GET `/analytics/supplier/regional`
> Role: `supplier`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "region": "Jakarta",
        "demand_score": 92,
        "growth_pct": 14
      },
      {
        "region": "Surabaya",
        "demand_score": 78,
        "growth_pct": 8
      }
    ]
  },
  "message": "OK"
}
```

---

### GET `/analytics/products/insights`
> Role: `distributor`, `supplier`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "top_selling": [
      { "item_id": "item-uuid-001", "name": "Tepung Terigu", "volume": 1800, "trend": "up" }
    ],
    "declining": [
      { "item_id": "item-uuid-002", "name": "Gula Pasir", "volume": 1200, "trend": "down" }
    ],
    "stock_risk": [
      { "item_id": "item-uuid-003", "name": "Minyak Goreng", "stock": 5, "min_stock": 30 }
    ]
  },
  "message": "OK"
}
```

---

## 13. AI Agents (overarching)
> **Scope:** Core MVP (v2.0/v3.0) · Role: `distributor` (full feature set), `supplier` (subset), `retailer` (subset)

Halaman terpusat untuk semua AI agent. Endpoint individual AI seperti `POST /ai/restock-recommendation`, `POST /ai/demand-forecast`, dan `POST /ai/credit-risk` tetap ada untuk dipanggil contextual.

**Agent availability per role:**
- **Distributor:** `demand_forecast`, `auto_restock`, `credit_risk`, `logistics_optimization`, `supplier_recommendation`
- **Supplier:** `demand_forecast` (consumer side)
- **Retailer:** `auto_restock`, `demand_forecast`, `supplier_recommendation`, `price_optimization`, `cash_flow_optimizer`

### GET `/ai/agents`
List semua AI agents + status & automation level.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "name": "demand_forecast",
        "label": "Demand Forecast Agent",
        "status": "active",
        "automation_level": "manual_approval",
        "last_run_at": "2026-04-29T07:00:00Z",
        "recent_actions_count": 12
      },
      {
        "name": "auto_restock",
        "label": "Auto Restock Agent",
        "status": "active",
        "automation_level": "manual_approval",
        "last_run_at": "2026-04-29T08:30:00Z",
        "recent_actions_count": 5
      },
      {
        "name": "credit_risk",
        "label": "Credit Risk Agent",
        "status": "active",
        "automation_level": "manual_approval",
        "last_run_at": "2026-04-28T16:00:00Z",
        "recent_actions_count": 3
      },
      {
        "name": "logistics_optimization",
        "label": "Logistics Optimization Agent",
        "status": "active",
        "automation_level": "manual_approval",
        "last_run_at": "2026-04-29T05:00:00Z",
        "recent_actions_count": 2
      },
      {
        "name": "supplier_recommendation",
        "label": "Supplier Recommendation Agent",
        "status": "paused",
        "automation_level": "manual_approval",
        "last_run_at": "2026-04-20T10:00:00Z",
        "recent_actions_count": 0
      }
    ],
    "performance_summary": {
      "automated_decisions_today": 22,
      "forecast_accuracy_pct": 87,
      "estimated_cost_savings_idr": 4500000,
      "operational_efficiency_gain_pct": 14
    }
  },
  "message": "OK"
}
```

**Agent name enum:** `demand_forecast` · `auto_restock` · `credit_risk` · `logistics_optimization` · `supplier_recommendation` · `price_optimization` · `cash_flow_optimizer`
**Status enum:** `active` · `paused` · `disabled`
**Automation level enum:** `manual_approval` · `auto_with_threshold` · `auto_execute`

> **Catatan untuk FE:** MVP membatasi `auto_execute` hanya untuk action *informational* (misal: generate forecast). Untuk action terminal (create order, settle payment, approve credit), backend tetap require manual confirmation meskipun config user `auto_execute`.

---

### PUT `/ai/agents/{agent_name}/config`
Update config agent.

**Request Body:**
```json
{
  "status": "active",
  "automation_level": "manual_approval",
  "thresholds": {
    "auto_restock_min_stock_ratio": 0.3,
    "credit_risk_max_score": 70
  }
}
```

**Response 200:** Updated agent object.

---

### GET `/ai/agents/recommendations`
Live recommendation feed (consolidated dari semua agent).

**Query Params:**
```
?agent=demand_forecast
?urgency=high
?limit=10
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recommendation_id": "rec-uuid-001",
        "agent": "auto_restock",
        "type": "restock_alert",
        "message": "Stok Tepung Terigu tinggal 15kg. Restock 100kg dari CV Maju Bersama.",
        "urgency": "high",
        "context": {
          "item_id": "item-uuid-001",
          "suggested_supplier_id": "supplier-uuid-001",
          "suggested_qty": 100,
          "suggested_unit": "kg"
        },
        "actionable_link": "/dashboard/orders/new?item_id=item-uuid-001",
        "generated_at": "2026-04-29T08:30:00Z"
      },
      {
        "recommendation_id": "rec-uuid-002",
        "agent": "credit_risk",
        "type": "credit_risk",
        "message": "Retailer B medium risk; pertimbangkan adjust limit -15%.",
        "urgency": "medium",
        "context": {
          "retailer_id": "retailer-uuid-002",
          "current_limit": 5000000,
          "suggested_limit": 4250000
        },
        "actionable_link": "/dashboard/credit/credit-uuid-002",
        "generated_at": "2026-04-28T16:00:00Z"
      }
    ]
  },
  "message": "OK"
}
```

---

## 14. Settings (Distributor & Supplier)
> **Scope:** Core MVP (v2.0)
>
> Field role-aware (FE menentukan tampilan; BE menentukan data berdasarkan auth context).

### GET `/settings/profile`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid-xxx",
    "full_name": "Budi Santoso",
    "email": "budi@example.com",
    "phone": "08123456789",
    "role": "distributor",
    "avatar_url": null
  },
  "message": "OK"
}
```

### PUT `/settings/profile`
**Request Body (semua field opsional):**
```json
{
  "full_name": "Budi Santoso",
  "phone": "08987654321",
  "avatar_url": "https://..."
}
```

---

### GET `/settings/business`

**Response 200 (distributor):**
```json
{
  "success": true,
  "data": {
    "business_name": "Toko Budi Jaya",
    "business_type": "retail_distribution",
    "tax_id": "01.234.567.8-901.000",
    "warehouse_locations": [
      { "id": "wh-001", "name": "Gudang Jakarta", "address": "Jl. ..." }
    ],
    "service_regions": ["Jakarta", "Bekasi", "Bogor"],
    "preferred_currency": "IDR",
    "operational_timezone": "Asia/Jakarta"
  },
  "message": "OK"
}
```

**Response 200 (supplier):** sama tetapi `business_type` umumnya `food_supplier`/`packaging_supplier` etc, dan `warehouse_locations` jadi production/warehouse facilities.

**Response 200 (retailer):** field utama:
- `business_name`, `business_type` (cth: `cafe`, `restaurant`, `bakery`, `retail_store`)
- `industry_type` (kategori industri spesifik)
- `tax_id`
- `business_address` (alamat outlet utama)
- `branch_locations[]` (opsional, untuk retailer multi-outlet)
- `preferred_currency`, `operational_timezone`
- `billing_subscription` (current_plan, next_renewal, payment_method) — retailer-only field
- `team_members_count` (read-only, jumlah staff dengan akses)
- `compliance_docs[]` (opsional: tax cert, business license metadata)

### PUT `/settings/business`
Update business info. Body field opsional.

---

### GET `/settings/notifications`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "channels": {
      "email": true,
      "in_app": true,
      "sms": false
    },
    "preferences": {
      "low_stock_alerts": true,
      "new_order_alerts": true,
      "partnership_request_alerts": true,
      "payment_confirmation": true,
      "overdue_payment_reminder": true,
      "ai_recommendation_alerts": true,
      "weekly_analytics_report": false
    }
  },
  "message": "OK"
}
```

### PUT `/settings/notifications`
Update preferensi (partial update OK).

---

### GET `/settings/integrations`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "erp": { "connected": false, "provider": null },
    "payment_gateway": { "connected": true, "provider": "xendit" },
    "wallet": {
      "connected": true,
      "address": "So1ana...xyz",
      "network": "solana_devnet"
    },
    "logistics": {
      "connected": false,
      "provider": null
    },
    "api_keys": [
      {
        "key_id": "key-uuid-001",
        "label": "Primary integration",
        "last_used_at": "2026-04-28T10:00:00Z",
        "created_at": "2026-01-15T00:00:00Z"
      }
    ]
  },
  "message": "OK"
}
```

### PUT `/settings/integrations/{type}`
`type` enum: `erp` · `payment_gateway` · `wallet` · `logistics`

**Request Body:**
```json
{
  "connected": true,
  "provider": "xendit",
  "credentials": {
    "api_key": "..."
  }
}
```

> **Catatan untuk Halim:** credentials wajib di-encrypt at rest. Jangan kembalikan credentials di response GET.

---

### POST `/settings/security/2fa/enable`
Enable 2FA TOTP.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code_url": "otpauth://totp/AUTOSUP:budi@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AUTOSUP"
  },
  "message": "Pindai QR code dengan authenticator app, lalu konfirmasi"
}
```

### POST `/settings/security/2fa/disable`

**Request Body:**
```json
{
  "totp_code": "123456"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": null,
  "message": "2FA dinonaktifkan"
}
```

---

### GET `/settings/security/sessions`
Active login sessions.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "sess-uuid-001",
        "device": "Chrome on Windows",
        "ip": "180.247.x.x",
        "city": "Jakarta",
        "is_current": true,
        "last_active_at": "2026-04-29T10:00:00Z"
      }
    ]
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