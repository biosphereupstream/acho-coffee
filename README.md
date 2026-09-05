# ☕ ACHO Coffee — Monorepo (Golang Backend & TypeScript Frontend)

Aplikasi web responsive (smartphone • tablet • laptop) untuk memesan kopi **fresh roasting terjadwal** dan sistem manajemen roastery terintegrasi.
Arsitektur project dibangun sebagai **Monorepo** dengan pemisahan folder khusus untuk **Backend (Golang)** dan **Frontend (TypeScript / Next.js)**.

---

## 🏛️ Struktur Monorepo

```
acho/
├── backend/                              # 🐹 Layanan Backend Go (Golang 1.27)
│   ├── cmd/server/main.go               # Entrypoint HTTP server (Chi Router)
│   ├── internal/                        # Config, DB connection pool, handlers, middleware
│   ├── Dockerfile                       # Container build produksi backend
│   ├── go.mod / go.sum                  # Manajemen dependensi Go
│   └── README.md                        # Dokumentasi teknis backend
│
├── frontend/                             # ⚡ Aplikasi Frontend (TypeScript / Next.js 16)
│   ├── src/                             # App Router, components, Drizzle DB, styles
│   ├── public/                          # Gambar, logo, icon, aset statis
│   ├── drizzle/                         # Migrasi skema database SQL Drizzle
│   ├── Dockerfile                       # Container build produksi frontend
│   ├── package.json                     # Dependensi paket @acho/frontend
│   ├── tsconfig.json                    # Konfigurasi TypeScript
│   ├── next.config.ts                   # Konfigurasi Next.js & optimasi kompresi
│   ├── components.json                  # Shadcn UI configuration
│   ├── drizzle.config.js                # Konfigurasi Drizzle ORM
│   ├── eslint.config.mjs                # Konfigurasi ESLint
│   ├── postcss.config.mjs               # Konfigurasi Tailwind CSS
│   └── README.md                        # Dokumentasi teknis frontend
│
├── scripts/                             # 🛠️ Skrip Operasional & Database
│   ├── ship.js                          # Auto-validate, commit, & ship ke GitHub
│   ├── sync-vercel-env.js               # Sinkronisasi environment variable ke Vercel
│   └── seed-official-menu.js            # Seeder menu resmi Biosphere Roast Works
│
├── .github/workflows/
│   └── ci.yml                           # GitHub Actions CI memvalidasi frontend & backend
│
├── package.json                         # Orkestrasi root monorepo (npm workspaces)
├── docker-compose.yml                   # Multi-service local stack (DB + Go + Next.js)
├── vercel.json                          # Konfigurasi deployment Vercel monorepo
├── .env.example                         # Blueprint variabel lingkungan
└── README.md                            # Dokumentasi utama proyek
```

---

## ✨ Fitur Utama

- **Landing page animasi 3D** — biji kopi prosedural (Three.js + React Three Fiber) yang berubah warna per tahap: green bean → light → medium → grind → brew.
- **Autentikasi lengkap** — email/password, **Google OAuth** (Supabase Auth), dan **guest / one-time buyer** (tanpa akun, akses status via token).
- **Katalog Real-Time & Micro-Cache** — waktu respon < 1ms untuk menu kopi sangrai & minuman, tersinkronisasi instan dengan perubahan admin.
- **Custom Order Roasting Wizard** — 4 profil roasting presisi, pilihan grind size, kemasan 100g hingga 1kg.
- **Wholesale B2B Portal** — matriks pemesanan volume B2B dengan batas diskon otomatis maks 10% dan form permintaan sampel.
- **Pengiriman Multi-Kurir** — integrasi **Biteship** (JNE, J&T, SiCepat, AnterAja, GoSend, GrabExpress) + pelacakan nomor resi.
- **Pembayaran Multi-Channel** — integrasi **Doku Jokul Checkout** (QRIS, VA BCA/Mandiri/BRI/BNI, e-Wallets, Kartu Kredit).
- **Panel Admin Roastery (`/admin`)**:
  - Proteksi login akun admin.
  - Dashboard analitik omzet & pesanan real-time.
  - Manajemen katalog menu (**Select All**, **Bulk Edit**, **Hapus Menu**).
  - Manajemen stok inventaris bahan baku & audit mutasi.
  - Manajemen pelanggan, tiering B2B, dan promosi WhatsApp/Email.
  - Cetak label kantong (*bag labels*) dan *packing slip*.
- **Layanan Backend Golang Berkinerja Tinggi**:
  - Routing cepat via Chi Router.
  - Connection pooling ke Supabase PostgreSQL (`pgxpool`).
  - Integrasi Cloudflare R2 untuk penyimpanan foto produk.
  - Auto-purge CDN Cloudflare untuk pembaruan instan.

---

## 🚀 Panduan Memulai Cepat

### 1. Instalasi Dependensi Monorepo
```bash
# Di direktori root
npm install
```
Perintah ini akan mengonfigurasi npm workspaces dan menghubungkan paket `@acho/frontend`.

### 2. Konfigurasi Environment Variable
```bash
cp .env.example .env.local
```
*(File `.env.local` akan otomatis terbaca oleh server Next.js di `frontend/` maupun server Go di `backend/`).*

### 3. Menjalankan Frontend (TypeScript / Next.js)
```bash
# Dari root
npm run dev

# Atau masuk ke direktori frontend
cd frontend
npm run dev
```
Buka browser di `http://localhost:3000`.

### 4. Menjalankan Backend (Golang)
```bash
# Dari root
npm run backend:start

# Atau masuk ke direktori backend
cd backend
go run ./cmd/server
```
Server backend berjalan di `http://localhost:8080`.

### 5. Menjalankan Stack Lengkap dengan Docker
```bash
docker compose up --build
```
Menjalankan container PostgreSQL lokal, server Go Backend, dan aplikasi Next.js Frontend secara bersamaan.

---

## 📋 Perintah Root Monorepo

| Command | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Next.js development server |
| `npm run build` | Build produksi Next.js teroptimasi |
| `npm run start` | Menjalankan server hasil build produksi |
| `npm run typecheck` | Pengecekan tipe TypeScript seluruh frontend |
| `npm run lint` | Pemeriksaan linting ESLint |
| `npm run validate` | Menjalankan typecheck & linting sekaligus |
| `npm run backend:start` | Menjalankan Go backend server |
| `npm run backend:build` | Mengompilasi binary Go backend |
| `npm run backend:test` | Menjalankan unit test Go backend |
| `npm run db:push` | Menerapkan skema Drizzle ke PostgreSQL |
| `npm run db:studio` | Membuka Drizzle Studio web GUI |
| `npm run ship` | Validasi, commit otomatis, dan push ke GitHub |

---

## 🚢 Deployment ke Vercel

Repository ini telah dikonfigurasi agar dapat dideploy langsung ke Vercel:
1. **Opsi A (Rekomendasi)**: Di pengaturan Vercel Dashboard (**Settings > General > Root Directory**), atur Root Directory ke `frontend`.
2. **Opsi B**: Deploy dari root monorepo. File `vercel.json` di root telah disiapkan dengan konfigurasi build command `npm run build --workspace=@acho/frontend` dan output directory `frontend/.next`.
