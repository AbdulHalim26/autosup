import os
from dotenv import load_dotenv
from fastapi import FastAPI
from supabase import create_client, Client
import google.generativeai as genai
from pydantic import BaseModel

class UpdateOrderStatus(BaseModel):
    order_id: int
    new_status: str

class PesananBaru(BaseModel):
    product_name: str
    retailer_name: str
    supplier_name: str
    quantity: int
    total_price: int

class UpdateStatusPesanan(BaseModel):
    status: str    
class BarangBaru(BaseModel):
    product_name: str
    current_stock: int

class UpdateStok(BaseModel):
    current_stock: int

class WebhookPayment(BaseModel):
    order_id: str
    transaction_status: str # Contoh: "settlement" (berhasil), "expire" (gagal)

class RequestKemitraan(BaseModel):
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

# 1. SETUP LINGKUNGAN
load_dotenv()
app = FastAPI()

# 2. KONEKSI SUPABASE
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# 3. KONEKSI GEMINI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# Pakai model yang tadi terbukti JALAN di mac kamu!
model = genai.GenerativeModel('models/gemini-flash-latest')

@app.get("/")
def home():
    return {"status": "AUTOSUP Backend Aktif", "engine": "Gemini 1.5 Flash"}

@app.get("/cek-stok")
def cek_stok():
    # Ambil data dari tabel inventories (sesuai skema kamu)
    data = supabase.table("inventories").select("*").execute()
    
    # Suruh Gemini menganalisis data tersebut
    prompt = f"Berikut adalah data stok barang kami: {data.data}. Berikan ringkasan singkat barang apa yang stoknya paling sedikit."
    response = model.generate_content(prompt)
    
    return {
        "data_asli": data.data,
        "analisis_gemini": response.text
    }

@app.get("/optimasi-logistik")
def optimasi_logistik():
    try:
        # 1. Tarik data stok dan tren dari tabel baru kita
        response = supabase.table("regional_stocks").select("*").execute()
        data_stok = response.data

        # 2. Prompt Engineering: Ubah Gemini jadi Manajer Logistik
        prompt = f"""
        Kamu adalah seorang Manajer Logistik dan Supply Chain yang sangat ahli.
        Berikut adalah data stok barang dan tren permintaan (demand) di berbagai kota saat ini:
        
        {data_stok}
        
        Tugasmu:
        1. Analisis kota mana yang mengalami kelebihan stok (overstock) padahal demand-nya 'Low'.
        2. Analisis kota mana yang terancam kehabisan stok padahal demand-nya 'High'.
        3. Berikan rekomendasi EKSEKUSI pemindahan barang yang spesifik (misal: "Pindahkan X barang dari Kota A ke Kota B") untuk menyelamatkan perusahaan dari kerugian.
        
        Berikan jawaban yang profesional, to the point, dan berbasis data di atas.
        """

        # 3. Minta Gemini berpikir dan menjawab
        ai_response = model.generate_content(prompt)

        # 4. Tampilkan hasilnya
        return {
            "status": "Sukses",
            "data_mentah": data_stok,
            "rekomendasi_ai": ai_response.text
        }

    except Exception as e:
        return {"status": "Error", "pesan": str(e)}
    
# --- FITUR ORDER MANAGEMENT & TRACKING ---

@app.get("/pesanan")
def get_semua_pesanan():
    try:
        # Menarik semua data pesanan dari tabel 'orders' milikmu
        response = supabase.table("orders").select("*").execute()
        return {"status": "Sukses", "data": response.data}
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.patch("/pesanan/{pesanan_id}")
def update_status_pesanan(pesanan_id: str, data: UpdateStatusPesanan):
    try:
        status_baru = data.status
        
        # Eksekusi update ke Supabase berdasarkan ID
        response = supabase.table("orders").update({"status": status_baru}).eq("id", pesanan_id).execute()
        
        # Cek kalau ternyata ID-nya gak ketemu di database
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Pesanan dengan ID tersebut tidak ditemukan."}
            
        return {
            "status": "Sukses", 
            "pesan": "Status pesanan berhasil diupdate!", 
            "data": response.data[0]
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}
    
@app.post("/buat-pesanan")
def buat_pesanan(data: PesananBaru):
    try:
        pesanan_dict = data.dict()
        pesanan_dict["status"] = "pending" 

        response = supabase.table("orders").insert(pesanan_dict).execute()
        
        return {
            "status": "Sukses", 
            "pesan": "Pesanan baru berhasil masuk ke sistem AUTOSUP!", 
            "data": response.data
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}    

@app.get("/pesanan/{pesanan_id}")
def get_detail_pesanan(pesanan_id: str):
    try:
        # Cari pesanan yang ID-nya cocok
        response = supabase.table("orders").select("*").eq("id", pesanan_id).execute()
        
        # Kalau datanya kosong (ID gak ketemu)
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Pesanan dengan ID tersebut tidak ditemukan."}
            
        return {
            "status": "Sukses", 
            "data": response.data[0] # Ambil data urutan pertama (karena ID pasti unik)
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.delete("/pesanan/{pesanan_id}")
def hapus_pesanan(pesanan_id: str):
    try:
        # Eksekusi hapus data berdasarkan ID
        response = supabase.table("orders").delete().eq("id", pesanan_id).execute()
        
        # Kalau datanya kosong (ID gak ketemu buat dihapus)
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Pesanan tidak ditemukan atau sudah dihapus sebelumnya."}
            
        return {
            "status": "Sukses", 
            "pesan": f"Pesanan dengan ID {pesanan_id} berhasil dibatalkan dan dihapus permanen!"
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}


@app.get("/ai/rekomendasi-restock")
def ai_rekomendasi_restock():
    try:
        # 1. AI menarik data dari gudang (tabel 'inventories')
        # Pastikan lu udah bikin tabel 'inventories' di Supabase ya!
        response = supabase.table("inventories").select("*").execute()
        stok_data = response.data
        
        # Kalau gudang kosong atau tabel belum ada
        if not stok_data:
            return {"status": "Gagal", "pesan": "Data stok kosong atau tabel inventories belum ada."}

        # 2. Prompt Engineering: Ngajarin Gemini jadi AI Supply Chain Agent
        prompt = f"""
        Kamu adalah 'AUTOSUP AI Agent', asisten rantai pasok cerdas kelas enterprise.
        Berikut adalah data stok gudang realtime saat ini:
        
        {stok_data}
        
        Tugasmu:
        1. Analisis barang mana saja yang stoknya Kritis (misalnya di bawah 20 unit).
        2. Buat rekomendasi RESTOCK otomatis untuk barang yang kritis tersebut. Sebutkan nama barang, nama supplier-nya, dan jumlah yang disarankan untuk dibeli agar stok kembali aman (misal target stok 100 unit).
        3. Gunakan bahasa yang profesional, ringkas, dan seolah-olah kamu sedang melapor ke Manajer Logistik. Berikan format poin-poin yang rapi.
        """

        # 3. Minta Gemini mengeksekusi analisis
        ai_response = model.generate_content(prompt)

        # 4. Kembalikan hasil analisis AI ke layar aplikasi
        return {
            "status": "Sukses",
            "pesan": "AI berhasil melakukan pemindaian gudang!",
            "rekomendasi_ai": ai_response.text,
            "data_mentah": stok_data
        }

    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.get("/ai/demand-forecasting")
def ai_demand_forecasting():
    try:
        # Kita pakai data stok yang ada sebagai acuan dasar AI
        response = supabase.table("inventories").select("product_name, current_stock").execute()
        data_stok = response.data

        # Prompt Engineering: Bikin AI bertingkah sebagai Peramal Tren Pasar (Data Scientist)
        prompt = f"""
        Kamu adalah 'AUTOSUP AI Demand Intelligence', spesialis prediksi pasar dan rantai pasok.
        Berikut adalah daftar barang yang ada di sistem kami saat ini:
        
        {data_stok}
        
        Tugasmu:
        1. Buatlah prediksi (forecasting) simulasi permintaan pasar untuk 7-14 hari ke depan. 
        2. Ciptakan skenario realistis (Contoh: "Permintaan Minyak Goreng diprediksi melonjak 40% karena adanya tren kelangkaan di pasar tradisional", atau "Permintaan Beras stabil").
        3. Berikan 'Actionable Insight' (Saran Strategis) untuk pihak Distributor/Retailer. Apakah mereka harus menimbun stok dari sekarang, atau menahan pembelian?
        4. Gunakan bahasa analitis, profesional, dan meyakinkan layaknya laporan Data Scientist ke CEO.
        """

        # Eksekusi AI
        ai_response = model.generate_content(prompt)

        return {
            "status": "Sukses",
            "fitur": "AI Demand Intelligence & Forecasting",
            "prediksi_ai": ai_response.text
        }

    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.get("/ai/credit-scoring/{nama_toko}")
def ai_credit_scoring(nama_toko: str):
    try:
        # 1. Tarik riwayat transaksi toko tersebut dari tabel 'orders'
        response = supabase.table("orders").select("*").eq("retailer_name", nama_toko).execute()
        data_transaksi = response.data
        
        # Kalau tokonya belum pernah belanja sama sekali
        if not data_transaksi:
            return {
                "status": "Gagal", 
                "pesan": f"Toko '{nama_toko}' belum memiliki riwayat transaksi di sistem kami."
            }

        # 2. Prompt Engineering: Bikin AI jadi Analis Keuangan (Risk Assessor)
        prompt = f"""
        Kamu adalah 'AUTOSUP AI Risk Assessor', seorang Analis Keuangan dan Risiko Kredit senior untuk B2B Supply Chain.
        Berikut adalah riwayat pesanan (transaksi) dari retailer bernama '{nama_toko}':
        
        {data_transaksi}
        
        Tugasmu:
        1. Analisis volume transaksi (total harga, kuantitas) dan status pesanan dari toko ini.
        2. Berikan "Credit Score" (skor 1-100) berdasarkan keaktifan belanja mereka.
        3. Tentukan Keputusan: apakah toko ini "LAYAK" atau "TIDAK LAYAK" mendapatkan fasilitas kasbon/kredit (Paylater/Tempo).
        4. Berikan rekomendasi Limit Kredit maksimal (misal: Rp 5.000.000, Rp 50.000.000, atau Rp 0 jika sangat berisiko).
        5. Berikan alasan dan profil risiko singkat.
        6. Gunakan bahasa format laporan finansial profesional yang ditujukan kepada Direktur Keuangan.
        """

        # 3. Eksekusi AI
        ai_response = model.generate_content(prompt)

        return {
            "status": "Sukses",
            "fitur": "AI Credit Scoring & Risk Assessment",
            "toko_dievaluasi": nama_toko,
            "hasil_analisis_ai": ai_response.text
        }

    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

# ==========================================
# --- FITUR MANAJEMEN INVENTARIS ---
# ==========================================

@app.post("/inventaris")
def tambah_barang(data: BarangBaru):
    try:
        response = supabase.table("inventories").insert(data.dict()).execute()
        return {"status": "Sukses", "pesan": "Barang baru berhasil ditambahkan!", "data": response.data}
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.patch("/inventaris/{barang_id}")
def update_stok(barang_id: str, data: UpdateStok):
    try:
        response = supabase.table("inventories").update({"current_stock": data.current_stock}).eq("id", barang_id).execute()
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Barang tidak ditemukan."}
        return {"status": "Sukses", "pesan": "Stok berhasil diupdate!", "data": response.data[0]}
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.delete("/inventaris/{barang_id}")
def hapus_barang(barang_id: str):
    try:
        response = supabase.table("inventories").delete().eq("id", barang_id).execute()
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Barang tidak ditemukan."}
        return {"status": "Sukses", "pesan": "Barang berhasil dihapus!"}
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

# ==========================================
# --- FITUR DASHBOARD AGGREGATOR ---
# ==========================================

@app.get("/dashboard-stats")
def get_dashboard_stats():
    try:
        # 1. Tarik semua data pesanan
        orders_res = supabase.table("orders").select("status").execute()
        semua_pesanan = orders_res.data
        total_pesanan = len(semua_pesanan)
        
        # Hitung pesanan yang belum selesai (pending/processing)
        pesanan_aktif = sum(1 for order in semua_pesanan if order.get("status") in ["pending", "processing"])

        # 2. Tarik semua data gudang (inventories)
        inv_res = supabase.table("inventories").select("current_stock").execute()
        semua_barang = inv_res.data
        total_jenis_barang = len(semua_barang)
        
        # Hitung barang yang stoknya kritis (di bawah 20)
        barang_menipis = sum(1 for barang in semua_barang if barang.get("current_stock", 0) < 20)

        # 3. Gabungkan semua data buat dikirim ke Frontend-nya Geral
        return {
            "status": "Sukses",
            "data": {
                "total_semua_pesanan": total_pesanan,
                "pesanan_sedang_aktif": pesanan_aktif,
                "total_jenis_barang": total_jenis_barang,
                "barang_stok_menipis": barang_menipis
            }
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

# ==========================================
# --- FITUR PAYMENT GATEWAY & SMART ESCROW ---
# ==========================================

@app.post("/payment/checkout/{pesanan_id}")
def checkout_pembayaran(pesanan_id: str):
    try:
        # 1. Cek apakah pesanan ada
        response = supabase.table("orders").select("*").eq("id", pesanan_id).execute()
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Pesanan tidak ditemukan."}
            
        pesanan = response.data[0]
        
        # 2. Simulasi Request ke API Midtrans/Xendit
        # Kita generate nomor Virtual Account (VA) secara acak
        import random
        nomor_va = f"8077{random.randint(1000000, 9999999)}"
        
        # 3. Update status pesanan jadi 'menunggu pembayaran'
        supabase.table("orders").update({"status": "pending"}).eq("id", pesanan_id).execute()

        return {
            "status": "Sukses",
            "pesan": "Checkout berhasil. Silakan lakukan pembayaran.",
            "data_pembayaran": {
                "order_id": pesanan_id,
                "total_tagihan": pesanan.get("total_price"),
                "metode": "BCA Virtual Account",
                "nomor_va": nomor_va,
                "status_pembayaran": "Menunggu Pembayaran"
            }
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.post("/payment/webhook")
def midtrans_webhook(data: WebhookPayment):
    try:
        # Ini adalah endpoint yang akan "DITEMBAK" secara otomatis oleh Midtrans/Xendit
        # ketika ada pelanggan yang selesai transfer di ATM/M-Banking.
        
        status_baru = "pending" # Default kalau belum jelas
        
        # Kalau status dari Midtrans adalah 'settlement' (artinya duit udah masuk)
        if data.transaction_status == "settlement":
            status_baru = "processing" # Masuk ke Smart Escrow (dana ditahan, barang diproses)
            pesan_notif = "Pembayaran BERHASIL diterima. Dana masuk ke Smart Escrow."
        # Kalau statusnya kadaluarsa / gagal
        elif data.transaction_status in ["expire", "cancel", "deny"]:
            status_baru = "cancelled"
            pesan_notif = "Pembayaran GAGAL atau KADALUARSA."
        else:
            return {"status": "Ignored", "pesan": "Status transaksi tidak perlu diproses."}

        # Update status pesanan di Database secara otomatis
        supabase.table("orders").update({"status": status_baru}).eq("id", data.order_id).execute()

        # Penting: Webhook HARUS mengembalikan status 200 OK agar Midtrans berhenti mengirim notifikasi
        return {
            "status": "Sukses", 
            "pesan": pesan_notif,
            "order_id": data.order_id,
            "status_pesanan_terkini": status_baru
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

# ==========================================
# --- FITUR KEMITRAAN (WEB3 PRE-REQUISITE) ---
# ==========================================

@app.get("/kemitraan/discover")
def discover_suppliers():
    # Untuk demo hackathon, kita sediakan daftar supplier statis/dummy
    # Biar Geral gampang nampilinnya di Frontend
    return {
        "status": "Sukses",
        "data": [
            {"nama_supplier": "PT Padi Nusantara Jaya", "kategori": "Beras & Biji-bijian", "reputasi_tier": "Gold"},
            {"nama_supplier": "CV Makmur Minyak", "kategori": "Minyak Goreng", "reputasi_tier": "Silver"},
            {"nama_supplier": "PT Gula Manis Terus", "kategori": "Bumbu Dapur", "reputasi_tier": "Platinum"}
        ]
    }

@app.post("/kemitraan/request")
def ajukan_kemitraan(data: RequestKemitraan):
    try:
        # Masukkan request ke tabel partnerships
        payload = {
            "retailer_name": data.retailer_name,
            "supplier_name": data.supplier_name,
            "status": "pending"
        }
        response = supabase.table("partnerships").insert(payload).execute()
        return {
            "status": "Sukses", 
            "pesan": f"Request kemitraan ke {data.supplier_name} berhasil dikirim!", 
            "data": response.data[0]
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

@app.patch("/kemitraan/approve/{kemitraan_id}")
def approve_kemitraan(kemitraan_id: str):
    try:
        # Update status jadi approved
        response = supabase.table("partnerships").update({"status": "approved"}).eq("id", kemitraan_id).execute()
        
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Data kemitraan tidak ditemukan."}

        return {
            "status": "Sukses",
            "pesan": "Kemitraan resmi disetujui! Siap dicetak menjadi NFT (SBT) di Solana.",
            "web3_ready": True,
            "data": response.data[0]
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}
# ==========================================
# --- FITUR TRACKING LOGISTIK (DISTRIBUTOR) ---
# ==========================================

@app.patch("/orders/update-logistik/{pesanan_id}")
def update_status_logistik(pesanan_id: str, status_baru: str):
    # status_baru yang valid: 'shipped' (dikirim) atau 'delivered' (sampai)
    status_diijinkan = ['shipped', 'delivered']
    
    if status_baru not in status_diijinkan:
        return {"status": "Gagal", "pesan": "Status logistik tidak valid. Gunakan 'shipped' atau 'delivered'."}
        
    try:
        # Update status di tabel orders
        response = supabase.table("orders").update({"status": status_baru}).eq("id", pesanan_id).execute()
        
        if len(response.data) == 0:
            return {"status": "Gagal", "pesan": "Pesanan tidak ditemukan."}

        return {
            "status": "Sukses", 
            "pesan": f"Status pesanan berhasil diperbarui menjadi: {status_baru}", 
            "data": response.data[0]
        }
    except Exception as e:
        return {"status": "Error", "pesan": str(e)}

import csv
from fastapi.responses import StreamingResponse
import io

# ==========================================
# --- MODUL 1: NOTIFICATION CENTER ---
# ==========================================
@app.get("/notifications/{user_name}")
def get_notifications(user_name: str):
    # Mengambil riwayat alert (stok menipis, update order, dll)
    response = supabase.table("notifications").select("*").eq("user_name", user_name).order("created_at", desc=True).execute()
    return {"status": "Sukses", "data": response.data}

@app.patch("/notifications/read/{notif_id}")
def mark_as_read(notif_id: str):
    supabase.table("notifications").update({"is_read": True}).eq("id", notif_id).execute()
    return {"status": "Sukses", "pesan": "Notifikasi ditandai telah dibaca."}

# ==========================================
# --- MODUL 2: AI PREFERENCES & SECURITY ---
# ==========================================
@app.get("/settings/ai/{user_name}")
def get_ai_settings(user_name: str):
    # Kustomisasi perilaku AI: sensitivity, depth, restock
    response = supabase.table("settings").select("*").eq("user_name", user_name).execute()
    return {"status": "Sukses", "data": response.data[0] if response.data else {}}

@app.patch("/settings/ai/{user_name}")
def update_ai_settings(user_name: str, settings: AISettingsUpdate):
    data = settings.dict()
    response = supabase.table("settings").upsert({"user_name": user_name, **data}).execute()
    return {"status": "Sukses", "pesan": "Pengaturan AI diperbarui.", "data": response.data[0]}

# ==========================================
# --- MODUL 3: TEAM MANAGEMENT ---
# ==========================================
@app.get("/team/{store_name}")
def get_team_members(store_name: str):
    # Manage internal users & roles
    response = supabase.table("team_members").select("*").eq("store_name", store_name).execute()
    return {"status": "Sukses", "data": response.data}

@app.post("/team/invite/{store_name}")
def invite_member(store_name: str, member: TeamMemberInvite):
    data = {"store_name": store_name, **member.dict()}
    response = supabase.table("team_members").insert(data).execute()
    return {"status": "Sukses", "pesan": f"Berhasil mengundang {member.member_name}.", "data": response.data[0]}

# ==========================================
# --- MODUL 4: EXPORT DATA (CSV) ---
# ==========================================
@app.get("/export/orders/{store_name}")
def export_orders_csv(store_name: str):
    # Mendukung export data untuk laporan profesional
    response = supabase.table("orders").select("*").eq("retailer_name", store_name).execute()
    
    if not response.data:
        return {"status": "Gagal", "pesan": "Tidak ada data untuk diexport."}

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=response.data[0].keys())
    writer.writeheader()
    writer.writerows(response.data)
    
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=laporan_order_{store_name}.csv"}
    )

print("Aplikasi siap dijalankan!")          