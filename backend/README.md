# ACHO Coffee — Go Backend Service

Layanan backend berkinerja tinggi yang dibangun menggunakan bahasa **Go (Golang)** untuk mendukung operasional roastery ACHO Coffee. Terintegrasi penuh dengan **Supabase PostgreSQL**, **Supabase Auth & Storage**, serta **Cloudflare R2** dan CDN edge caching.

---

## 🚀 Fitur Utama

1. **Konfigurasi Database & Frontend**:
   - Telemetri koneksi Supabase PostgreSQL (`pgxpool`) dengan fallback otomatis ke persistent storage lokal.
   - Manajemen konfigurasi dinamis frontend (banner promo, pengumuman jadwal roasting, jam operasional, ambang gratis ongkir).
   - Penegakan aturan bisnis: **Batas maksimal diskon B2B terkunci di 10%**.

2. **Dashboard Detail & Analitik**:
   - Ringkasan metrik omzet, total pesanan, pelanggan aktif, dan peringatan stok rendah.
   - Grafik tren pendapatan 7 hari & breakdown volume penjualan Biji Kopi Sangrai vs Minuman Siap Minum.
   - Daftar produk terlaris (*Top Selling Products*) dan antrian pesanan terbaru.

3. **Manajemen Inventaris (Inventory Management)**:
   - Pelacakan stok bahan baku: Green Beans, Botol Kale 250ml, Pet Can 250ml, Botol 1L, Simplicity Pouch, Espresso Pouch, Kraft Bag 250g, dan Foil Bag 1kg.
   - Fitur penyesuaian stok (+/-) instan untuk restock, batch roasting, pemakaian bar, dan kerusakan.
   - Pencatatan buku besar mutasi stok (*inventory logs*) untuk audit roastery.
   - Peringatan otomatis untuk item yang berada di bawah batas minimum (*low stock alert*).

4. **Daftar Pelanggan (Customer Management)**:
   - Filter pelanggan berdasarkan tier (`retail`, `b2b_bronze`, `b2b_silver`, `b2b_gold`).
   - Fitur **Select All** & **Bulk Edit** (ubah tier massal, tambah/hapus tag).
   - Fitur **Send Promotion**:
     - Pembuatan kode voucher diskon dengan batas maksimal 10% untuk mitra B2B.
     - Generator template pesan WhatsApp dan Email siap kirim.
     - Riwayat siaran promosi (*broadcast logs*).

5. **Kelola Menu (Menu Catalog Management)**:
   - CRUD item menu untuk Biji Kopi dan Minuman.
   - Fitur **Select All** & **Bulk Edit**:
     - Penyesuaian harga massal (+/- % atau nominal IDR).
     - Toggle status aktif/nonaktif di katalog.
     - Setel stok massal.
   - Upload foto produk langsung ke **Cloudflare R2**.

6. **Integrasi Eksternal**:
   - **Supabase**: PostgreSQL connection pool, token auth verification.
   - **Cloudflare**: Cloudflare R2 S3-compatible asset storage, Cloudflare CDN auto cache purge, Cloudflare Turnstile bot verification.

---

## 🛠️ Menjalankan Backend

### Cara Cepat (Dev Lokal)
```bash
# Dari root project
npm run backend:start

# Atau dari direktori backend
cd backend
go run ./cmd/server
```

Backend akan berjalan di `http://localhost:8080`.

### Build Binary
```bash
npm run backend:build
# Menghasilkan executable server.exe di folder backend/
```

### Jalankan via Docker
```bash
cd backend
docker build -t acho-backend .
docker run -p 8080:8080 --env-file ../.env.local acho-backend
```

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Health check service |
| `GET` | `/api/config/database` | Telemetri koneksi DB, Supabase, & Cloudflare |
| `GET` | `/api/config/frontend` | Ambil konfigurasi dinamis toko & banner |
| `PUT` | `/api/config/frontend` | Perbarui konfigurasi toko & purge CDN cache |
| `GET` | `/api/dashboard/stats` | Statistik kartu ringkasan dashboard |
| `GET` | `/api/dashboard/analytics` | Data tren omzet, produk terlaris & kategori |
| `GET` | `/api/inventory` | Daftar seluruh stok inventaris & filter |
| `GET` | `/api/inventory/alerts` | Daftar item di bawah batas minimum |
| `POST` | `/api/inventory` | Tambah item bahan/kemasan baru |
| `POST` | `/api/inventory/{id}/adjust` | Sesuaikan stok (+/-) dengan catatan audit |
| `GET` | `/api/inventory/{id}/logs` | Riwayat mutasi stok per item |
| `GET` | `/api/customers` | Daftar pelanggan terfilter |
| `POST` | `/api/customers/bulk-edit` | Aksi massal ubah tier / tag (Select All) |
| `POST` | `/api/customers/send-promotion` | Buat & kirim promosi (Diskon B2B max 10%) |
| `GET` | `/api/customers/promotions` | Riwayat siaran promosi yang telah dikirim |
| `GET` | `/api/menu` | Daftar katalog menu (beans & minuman) |
| `POST` | `/api/menu` | Tambah menu baru |
| `PUT` | `/api/menu/{id}` | Edit menu satuan |
| `DELETE` | `/api/menu/{id}` | Hapus/arsipkan menu |
| `POST` | `/api/menu/bulk-edit` | Edit massal harga/status/stok (Select All) |
| `POST` | `/api/menu/upload` | Upload media produk ke Cloudflare R2 |
