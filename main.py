import os
import csv
import io
import random
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client
import google.generativeai as genai
from pydantic import BaseModel
from typing import Any, Optional

# ==========================================
# 1. PYDANTIC MODELS 
# ==========================================
class RegisterReq(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    business_name: str
    phone: str

class LoginReq(BaseModel):
    email: str
    password: str
    recaptcha_token: Optional[str] = None

class RefreshReq(BaseModel):
    refresh_token: str

class OrderPatchStatus(BaseModel):
    status: str    

class NewOrder(BaseModel):
    product_name: str
    retailer_name: str
    supplier_name: str
    quantity: int
    total_price: int

class NewInventoryItem(BaseModel):
    product_name: str
    current_stock: int

class UpdateStockReq(BaseModel):
    current_stock: int

class WebhookPayment(BaseModel):
    order_id: str
    transaction_status: str

class SupplierRequest(BaseModel):
    retailer_name: str
    supplier_name: str

class AISettingsUpdate(BaseModel):
    automation_sensitivity: int
    forecasting_depth: str
    auto_restock_enabled: bool

class TeamMemberInvite(BaseModel):
    member_name: str
    role: str
    email: str    

# --- MODEL BARU UNTUK AI (REQUEST BODY) ---
class AIRestockReq(BaseModel):
    item_id: Optional[str] = None

class AIDemandReq(BaseModel):
    item_id: Optional[str] = None
    forecast_days: int = 7

class AICreditReq(BaseModel):
    store_name: str

class AILogisticsReq(BaseModel):
    region: Optional[str] = None

# ==========================================
# 2. SETUP LINGKUNGAN & CORS
# ==========================================
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://autosup-production.up.railway.app",
        "https://autosup-backend-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. RESPONSE ENVELOPE (BUNGKUSAN DATA STANDAR)
# ==========================================
def success_response(data: Any = None, message: str = "OK"):
    return {
        "success": True,
        "data": data,
        "message": message
    }

def error_response(message: str):
    return {
        "success": False,
        "data": None,
        "message": message
    }

# ==========================================
# 4. KONEKSI SUPABASE & GEMINI
# ==========================================
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('models/gemini-1.5-flash')

@app.get("/")
def home():
    return success_response(data={"status": "AUTOSUP Backend Aktif", "engine": "Gemini 1.5 Flash"}, message="Server is running")

# ==========================================
# --- FITUR AUTENTIKASI (AUTH) ---
# ==========================================
@app.post("/auth/register")
def register_user(req: RegisterReq):
    try:
        # Daftar via Supabase Auth dan simpan data tambahan (role, nama) di user_metadata
        res = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": {
                "data": {
                    "full_name": req.full_name,
                    "role": req.role,
                    "business_name": req.business_name,
                    "phone": req.phone
                }
            }
        })

        if not res.user:
            return error_response("Gagal mendaftarkan user.")

        data_return = {
            "user_id": res.user.id,
            "email": res.user.email,
            "role": req.role,
            "access_token": res.session.access_token if res.session else None
        }
        return success_response(data=data_return, message="Registrasi berhasil")
    except Exception as e:
        return error_response(f"Gagal Register: {str(e)}")

@app.post("/auth/login")
def login_user(req: LoginReq):
    try:
        # Login via Supabase Auth
        res = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })

        # Tarik data tambahan yang tadi disimpen pas register
        user_meta = res.user.user_metadata
        data_return = {
            "user_id": res.user.id,
            "full_name": user_meta.get("full_name", ""),
            "role": user_meta.get("role", "distributor"),
            "business_name": user_meta.get("business_name", ""),
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token
        }
        return success_response(data=data_return, message="Login berhasil")
    except Exception as e:
        return error_response("Login gagal. Cek kembali email dan password Anda.")

@app.post("/auth/refresh")
def refresh_token(req: RefreshReq):
    try:
        res = supabase.auth.refresh_session(req.refresh_token)
        data_return = {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token
        }
        return success_response(data=data_return, message="Token berhasil diperbarui")
    except Exception as e:
        return error_response(f"Gagal refresh token: {str(e)}")

@app.post("/auth/logout")
def logout_user():
    try:
        supabase.auth.sign_out()
        return success_response(message="Logout berhasil")
    except Exception as e:
        return error_response(f"Gagal logout: {str(e)}")

# ==========================================
# --- FITUR INVENTORY MANAJEMEN ---
# ==========================================
@app.get("/inventory")
def get_semua_inventory():
    try:
        response = supabase.table("inventories").select("*").execute()
        
        # --- PROSES MAPPING DATA BUAT FE GERAL ---
        mapped_data = []
        for item in response.data:
            mapped_data.append({
                "id": item.get("id"),
                "name": item.get("product_name"),          # Disesuaikan dengan FE
                "stock": item.get("current_stock"),        # Disesuaikan dengan FE
                "min_stock": item.get("min_threshold", 0), # Disesuaikan dengan FE
                "category": item.get("category", "umum"),
                "unit": item.get("unit", "pcs")
            })
            
        return success_response(data=mapped_data, message="Berhasil mengambil data inventory")
    except Exception as e:
        return error_response(str(e))

@app.post("/inventory")
def tambah_barang(data: NewInventoryItem):
    try:
        response = supabase.table("inventories").insert(data.dict()).execute()
        
        # Mapping juga untuk data yang baru ditambah
        item = response.data[0]
        mapped_item = {
            "id": item.get("id"),
            "name": item.get("product_name"),
            "stock": item.get("current_stock"),
            "min_stock": item.get("min_threshold", 0),
            "category": item.get("category", "umum"),
            "unit": item.get("unit", "pcs")
        }
        return success_response(data=mapped_item, message="Barang baru berhasil ditambahkan")
    except Exception as e:
        return error_response(str(e))

@app.patch("/inventory/{barang_id}")
def update_stok(barang_id: str, data: UpdateStockReq):
    try:
        response = supabase.table("inventories").update({"current_stock": data.current_stock}).eq("id", barang_id).execute()
        if len(response.data) == 0:
            return error_response("Barang tidak ditemukan.")
            
        # Mapping juga untuk data yang baru diupdate
        item = response.data[0]
        mapped_item = {
            "id": item.get("id"),
            "name": item.get("product_name"),
            "stock": item.get("current_stock"),
            "min_stock": item.get("min_threshold", 0),
            "category": item.get("category", "umum"),
            "unit": item.get("unit", "pcs")
        }
        return success_response(data=mapped_item, message="Stok berhasil diupdate")
    except Exception as e:
        return error_response(str(e))

@app.delete("/inventory/{barang_id}")
def hapus_barang(barang_id: str):
    try:
        response = supabase.table("inventories").delete().eq("id", barang_id).execute()
        if len(response.data) == 0:
            return error_response("Barang tidak ditemukan.")
        return success_response(message="Barang berhasil dihapus")
    except Exception as e:
        return error_response(str(e))


# ==========================================
# --- FITUR ORDER MANAGEMENT & TRACKING ---
# ==========================================
@app.get("/orders")
def get_semua_pesanan():
    try:
        response = supabase.table("orders").select("*").execute()
        return success_response(data=response.data, message="Berhasil menarik semua pesanan")
    except Exception as e:
        return error_response(str(e))

@app.post("/orders")
def buat_pesanan(data: NewOrder):
    try:
        pesanan_dict = data.dict()
        pesanan_dict["status"] = "pending" 
        response = supabase.table("orders").insert(pesanan_dict).execute()
        return success_response(data=response.data[0], message="Pesanan baru berhasil dibuat")
    except Exception as e:
        return error_response(str(e))    

@app.get("/orders/{pesanan_id}")
def get_detail_pesanan(pesanan_id: str):
    try:
        response = supabase.table("orders").select("*").eq("id", pesanan_id).execute()
        if len(response.data) == 0:
            return error_response("Pesanan tidak ditemukan.")
        return success_response(data=response.data[0], message="Detail pesanan ditemukan")
    except Exception as e:
        return error_response(str(e))

@app.patch("/orders/{pesanan_id}")
def update_status_pesanan(pesanan_id: str, data: OrderPatchStatus):
    try:
        response = supabase.table("orders").update({"status": data.status}).eq("id", pesanan_id).execute()
        if len(response.data) == 0:
            return error_response("Pesanan tidak ditemukan.")
        return success_response(data=response.data[0], message="Status pesanan berhasil diupdate")
    except Exception as e:
        return error_response(str(e))

@app.delete("/orders/{pesanan_id}")
def hapus_pesanan(pesanan_id: str):
    try:
        response = supabase.table("orders").delete().eq("id", pesanan_id).execute()
        if len(response.data) == 0:
            return error_response("Pesanan tidak ditemukan.")
        return success_response(message=f"Pesanan {pesanan_id} dibatalkan permanen")
    except Exception as e:
        return error_response(str(e))


# ==========================================
# --- FITUR ARTIFICIAL INTELLIGENCE (AI) ---
# ==========================================
@app.post("/ai/check-stock")
def ai_cek_stok():
    try:
        data = supabase.table("inventories").select("*").execute()
        prompt = f"Berikut adalah data stok barang kami: {data.data}. Berikan ringkasan singkat barang apa yang stoknya paling sedikit."
        ai_response = model.generate_content(prompt)
        
        hasil = {"data_asli": data.data, "analisis_gemini": ai_response.text}
        return success_response(data=hasil, message="Analisis stok AI selesai")
    except Exception as e:
        return error_response(str(e))

@app.post("/ai/logistics-optimization")
def ai_optimasi_logistik(req: AILogisticsReq):
    try:
        response = supabase.table("regional_stocks").select("*").execute()
        prompt = f"""Kamu Manajer Logistik. Analisis data {response.data}. Target regional: {req.region if req.region else 'Semua'}. Beri rekomendasi pemindahan barang."""
        ai_response = model.generate_content(prompt)
        
        return success_response(data={"rekomendasi_ai": ai_response.text}, message="Optimasi logistik berhasil dirumuskan")
    except Exception as e:
        return error_response(str(e))

@app.post("/ai/restock-recommendation")
def ai_rekomendasi_restock(req: AIRestockReq):
    try:
        response = supabase.table("inventories").select("*").execute()
        # Kalau frontend ngirim item_id, kita bisa filter di kodingan AI sini nanti
        prompt = f"Sebagai AI Supply Chain. Cek data stok: {response.data}. Buat rekomendasi restock untuk barang kritis. Fokus ID: {req.item_id if req.item_id else 'Semua'}."
        ai_response = model.generate_content(prompt)
        
        return success_response(data={"rekomendasi_ai": ai_response.text}, message="Rekomendasi restock berhasil dibuat")
    except Exception as e:
        return error_response(str(e))

@app.post("/ai/demand-forecast")
def ai_demand_forecasting(req: AIDemandReq):
    try:
        response = supabase.table("inventories").select("product_name, current_stock").execute()
        prompt = f"Buat prediksi permintaan {req.forecast_days} hari ke depan untuk data: {response.data}."
        ai_response = model.generate_content(prompt)

        return success_response(data={"prediksi_ai": ai_response.text}, message="Demand forecasting selesai")
    except Exception as e:
        return error_response(str(e))

@app.post("/ai/credit-scoring")
def ai_credit_scoring(req: AICreditReq):
    try:
        response = supabase.table("orders").select("*").eq("retailer_name", req.store_name).execute()
        if not response.data:
            return error_response(f"Toko {req.store_name} belum ada transaksi.")
            
        prompt = f"Analisis data transaksi dari {req.store_name}: {response.data}. Beri skor kredit dan limit."
        ai_response = model.generate_content(prompt)

        hasil = {"toko": req.store_name, "hasil_analisis_ai": ai_response.text}
        return success_response(data=hasil, message="Credit scoring selesai")
    except Exception as e:
        return error_response(str(e))


# ==========================================
# --- FITUR DASHBOARD ---
# ==========================================
@app.get("/dashboard")
def get_dashboard_stats():
    try:
        orders_res = supabase.table("orders").select("status").execute()
        pesanan_aktif = sum(1 for order in orders_res.data if order.get("status") in ["pending", "processing"])

        inv_res = supabase.table("inventories").select("current_stock").execute()
        barang_menipis = sum(1 for barang in inv_res.data if barang.get("current_stock", 0) < 20)

        data_dashboard = {
            "total_semua_pesanan": len(orders_res.data),
            "pesanan_sedang_aktif": pesanan_aktif,
            "total_jenis_barang": len(inv_res.data),
            "barang_stok_menipis": barang_menipis
        }
        return success_response(data=data_dashboard, message="Data dashboard berhasil ditarik")
    except Exception as e:
        return error_response(str(e))


# ==========================================
# --- FITUR PAYMENT GATEWAY & ESCROW ---
# ==========================================
@app.post("/payments/checkout/{pesanan_id}")
def checkout_pembayaran(pesanan_id: str):
    try:
        response = supabase.table("orders").select("*").eq("id", pesanan_id).execute()
        if len(response.data) == 0:
            return error_response("Pesanan tidak ditemukan.")
            
        nomor_va = f"8077{random.randint(1000000, 9999999)}"
        supabase.table("orders").update({"status": "pending"}).eq("id", pesanan_id).execute()

        data_bayar = {
            "order_id": pesanan_id,
            "total_tagihan": response.data[0].get("total_price"),
            "metode": "BCA Virtual Account",
            "nomor_va": nomor_va
        }
        return success_response(data=data_bayar, message="Checkout berhasil, VA digenerate")
    except Exception as e:
        return error_response(str(e))

@app.post("/payments/webhook")
def midtrans_webhook(data: WebhookPayment):
    try:
        status_baru = "pending"
        if data.transaction_status == "settlement":
            status_baru = "processing"
        elif data.transaction_status in ["expire", "cancel", "deny"]:
            status_baru = "cancelled"

        supabase.table("orders").update({"status": status_baru}).eq("id", data.order_id).execute()
        return success_response(data={"order_id": data.order_id}, message=f"Webhook diterima, status jadi {status_baru}")
    except Exception as e:
        return error_response(str(e))


# ==========================================
# --- FITUR SUPPLIER / KEMITRAAN ---
# ==========================================
@app.get("/suppliers/discover")
def discover_suppliers():
    data_dummy = [
        {"nama_supplier": "PT Padi Nusantara Jaya", "kategori": "Beras & Biji-bijian", "reputasi_tier": "Gold"},
        {"nama_supplier": "CV Makmur Minyak", "kategori": "Minyak Goreng", "reputasi_tier": "Silver"}
    ]
    return success_response(data=data_dummy, message="Berhasil tarik list supplier")

@app.post("/suppliers/request")
def ajukan_kemitraan(data: SupplierRequest):
    try:
        payload = {"retailer_name": data.retailer_name, "supplier_name": data.supplier_name, "status": "pending"}
        response = supabase.table("partnerships").insert(payload).execute()
        return success_response(data=response.data[0], message="Request kemitraan dikirim")
    except Exception as e:
        return error_response(str(e))

@app.patch("/suppliers/approve/{kemitraan_id}")
def approve_kemitraan(kemitraan_id: str):
    try:
        response = supabase.table("partnerships").update({"status": "approved"}).eq("id", kemitraan_id).execute()
        if len(response.data) == 0:
            return error_response("Data kemitraan tidak ditemukan")
        return success_response(data=response.data[0], message="Kemitraan disetujui (Web3 Ready)")
    except Exception as e:
        return error_response(str(e))


# ==========================================
# --- MODUL LAINNYA ---
# ==========================================
@app.patch("/logistics/update/{pesanan_id}")
def update_status_logistik(pesanan_id: str, status_baru: str):
    if status_baru not in ['shipped', 'delivered']:
        return error_response("Status logistik harus 'shipped' atau 'delivered'.")
    try:
        response = supabase.table("orders").update({"status": status_baru}).eq("id", pesanan_id).execute()
        return success_response(data=response.data[0], message=f"Logistik diupdate jadi {status_baru}")
    except Exception as e:
        return error_response(str(e))

@app.get("/notifications/{user_name}")
def get_notifications(user_name: str):
    response = supabase.table("notifications").select("*").eq("user_name", user_name).order("created_at", desc=True).execute()
    return success_response(data=response.data, message="Notifikasi ditarik")

@app.patch("/notifications/read/{notif_id}")
def mark_as_read(notif_id: str):
    supabase.table("notifications").update({"is_read": True}).eq("id", notif_id).execute()
    return success_response(message="Notifikasi ditandai dibaca")

@app.get("/settings/ai/{user_name}")
def get_ai_settings(user_name: str):
    response = supabase.table("settings").select("*").eq("user_name", user_name).execute()
    return success_response(data=response.data[0] if response.data else {}, message="Setting AI ditarik")

@app.patch("/settings/ai/{user_name}")
def update_ai_settings(user_name: str, settings: AISettingsUpdate):
    response = supabase.table("settings").upsert({"user_name": user_name, **settings.dict()}).execute()
    return success_response(data=response.data[0] if response.data else None, message="Setting AI diupdate")

@app.get("/team/{store_name}")
def get_team_members(store_name: str):
    response = supabase.table("team_members").select("*").eq("store_name", store_name).execute()
    return success_response(data=response.data, message="Team ditarik")

@app.post("/team/invite/{store_name}")
def invite_member(store_name: str, member: TeamMemberInvite):
    response = supabase.table("team_members").insert({"store_name": store_name, **member.dict()}).execute()
    return success_response(data=response.data[0], message="Member diundang")

@app.get("/export/orders/{store_name}")
def export_orders_csv(store_name: str):
    response = supabase.table("orders").select("*").eq("retailer_name", store_name).execute()
    if not response.data:
        return error_response("Tidak ada data untuk diexport.")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=response.data[0].keys())
    writer.writeheader()
    writer.writerows(response.data)
    
    # Khusus export file CSV nggak pakai envelope success_response biar file-nya nggak rusak
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=laporan_order_{store_name}.csv"}
    )