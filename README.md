# ☕ ACHO Coffee — Fresh Roasting On-Demand

Aplikasi web responsive (smartphone • tablet • laptop) untuk memesan kopi **fresh roasting terjadwal**.
Customer membuka landing page dengan **animasi 3D perjalanan kopi** (green bean → light roast → medium roast → grind → brew),
lalu bisa langsung sign in / sign up / Google OAuth / **one-time buyer**, memilih kopi, profil roasting (dengan rekomendasi),
grind size, jadwal ambil (antrian) atau kirim (tracing Biteship), membayar via Doku, dan memantau status sampai selesai.

## ✨ Fitur

- **Landing page animasi 3D** — biji kopi prosedural (Three.js + React Three Fiber) yang berubah warna per tahap: green bean → light → medium → grind (hujan bubuk kopi) → brew (cangkir + uap), auto-play dengan kontrol.
- **Autentikasi lengkap** — email/password, **Google OAuth** (Supabase Auth), dan **guest / one-time buyer** (tanpa akun, akses status via token di email).
- **Katalog** — 7 varian single origin & blend nusantara (seed siap pakai).
- **Rekomendasi profil roasting** — berdasarkan metode seduh + selera + jenis kopi.
- **Grind size** — bean / fine / medium / coarse.
- **Jadwal antrian pickup** — tanggal ambil dihitung dari lead time roasting (+2 hari) dan kapasitas harian (120 bungkus), slot otomatis.
- **Pengiriman + tracing** — integrasi **Biteship** (JNE, J&T, SiCepat, AnterAja), webhook status kurir.
- **Pembayaran** — integrasi **Doku Jokul Checkout** (VA BCA/Mandiri/BRI/BNI, OVO, DANA, LinkAja, ShopeePay, QRIS) + webhook notifikasi.
- **Email transaksional** — **Resend**: konfirmasi pesanan, pembayaran sukses, update tiap tahap.
- **Status real-time** — timeline proses (polling 8 detik) + riwayat tracing kurir.
- **Panel admin** — **/admin**: kelola status pesanan & lihat antrian pickup per tanggal.
- **Mode demo** — tanpa env apa pun, seluruh alur (pesan → bayar simulasi → status) tetap bisa dicoba; katalog dari seed, pesanan di memory store.

## 🧱 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | **Next.js 16** (App Router, TypeScript, Turbopack) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (green metallic, gold metallic, white glossy) |
| Database | **Supabase Postgres** + **Drizzle ORM** |
| Auth | **Supabase Auth** (email/password + Google OAuth) |
| State | **React Query** (TanStack Query v5) |
| Email | **Resend** |
| Pembayaran | **Doku / Jokul Checkout API** |
| Kirim | **Biteship API** |
| Storage | **Cloudflare R2** (S3-compatible) |
| CDN/DNS | **Cloudflare** (proxy + proteksi) |
| Hosting | **Vercel** |

## 🚀 Mulai Cepat

```bash
# 1. install
npm install          # atau pnpm install

# 2. env (lihat .env.example)
cp .env.example .env.local

# 3a. OPSI A: langsung jalan di MODE DEMO (tanpa DB/keys)
npm run dev          # → http://localhost:3000

# 3b. OPSI B: dengan database lokal
docker compose up -d
npm run db:push     # push schema Drizzle ke Postgres lokal
npm run dev
```

Alur demo: buka katalog → pilih kopi → isi wizard → **buat pesanan** → halaman pembayaran menampilkan
VA simulasi → klik **"Simulasi Pembayaran Berhasil"** → status berubah real-time → buka **/admin** untuk
menggeser status (antrian → roasting → resting → siap diambil/dikirim).

> Pesanan tersimpan di memory store saat **DATABASE_URL** kosong (reset saat server restart).
> Setelah **DATABASE_URL** diisi, seluruh data otomatis masuk ke Postgres via Drizzle.

## 🔐 Supabase (Auth + Database)

1. Buat project di [supabase.com](https://supabase.com) (region terdekat: Singapore).
2. **Auth → Providers → Google** → aktifkan, isi Client ID & Secret dari Google Cloud Console.
   - Authorized redirect URI: **https://<project-ref>.supabase.co/auth/v1/callback**
   - Di Google Cloud: **APIs → OAuth consent screen** (tambahkan test user untuk development).
3. **Project Settings → API**: salin URL & anon key → **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_ANON_KEY**.
4. **Project Settings → Database → Connection string** (URI, port 6543) → **DATABASE_URL**.
5. Jalankan migrasi: **npm run db:push** (atau psql -f drizzle/0000_init.sql).
6. **Authentication → URL Configuration**:
   - Site URL: **https://domainkamu.com**
   - Redirect URLs: **https://domainkamu.com/auth/callback** dan **http://localhost:3000/auth/callback**

## 💳 Doku (Pembayaran)

1. Daftar di [Jokul Doku](https://jokul.doku.com) → dapatkan **Client ID** & **Shared Key** (sandbox dulu).
2. Isi env: **DOKU_ENV=sandbox**, **DOKU_CLIENT_ID**, **DOKU_SHARED_KEY**.
3. Webhook notifikasi: daftarkan **https://domainkamu.com/api/webhooks/doku** di dashboard Doku.
4. Kode memakai **Checkout API v1** (POST /checkout/v1/payment) dengan signature HMAC-SHA256
   (**Client-Id|Request-Timestamp|body** → base64). Verifikasi webhook sudah diimplementasikan.

## 📦 Biteship (Kurir & Tracing)

1. Daftar di [biteship.com](https://biteship.com) → salin **API key** → **BITESHIP_API_KEY**.
2. Cari **area_id** asal roastery: GET /v1/maps/areas?countries=ID&input=Bandung → **BITESHIP_ORIGIN_AREA_ID**.
3. Webhook: daftarkan **https://domainkamu.com/api/webhooks/biteship** di dashboard Biteship.

## ✉️ Resend (Email)

1. Daftar di [resend.com](https://resend.com) (free tier 3.000 email/bulan) → API key → **RESEND_API_KEY**.
2. Verifikasi domain pengirim → **RESEND_FROM_EMAIL="ACHO Coffee <hello@domainkamu.com>"**.

## ☁️ Cloudflare R2 (Object Storage)

1. Cloudflare Dashboard → **R2** → buat bucket **acho-coffee**.
2. **Manage R2 API Tokens** → buat token (Object Read & Write) → isi **R2_ACCESS_KEY_ID**, **R2_SECRET_ACCESS_KEY**, **R2_ACCOUNT_ID**.
3. Supaya file bisa diakses publik, pasang **Custom Domain** pada bucket (mis. **cdn.domainkamu.com**) → **R2_PUBLIC_URL=https://cdn.domainkamu.com** (atau aktifkan public URL r2.dev).
4. Upload gambar produk dari endpoint admin **POST /api/upload** (multipart **file**) — URL dipakai di kolom **coffees.image_url**.

## 🌐 Cloudflare sebagai CDN / DNS / Proteksi

1. Tambahkan domain ke Cloudflare → ganti nameserver di registrar → tunggu aktif.
2. **DNS → Records**: buat **CNAME @ → cname.vercel-dns.com** (dan www), **Proxy: 🟠 on**.
3. **SSL/TLS → Mode: Full (strict)** (Vercel sudah menyediakan sertifikat).
4. Rekomendasi proteksi:
   - **Security → WAF**: aktifkan managed rules + rate limiting (mis. 100 req/10 dtk per IP).
   - **Speed → Optimization**: aktifkan Brotli, Early Hints, minify JS/CSS/HTML.
   - **Caching → Cache Rules**: cache **_next/static/*** dengan Edge TTL panjang.
   - **DDoS**: mode "Under Attack" hanya saat insiden.

## ▲ Deploy ke Vercel

1. Push repo ini ke GitHub (lihat bawah) → import di [vercel.com](https://vercel.com) → framework otomatis terdeteksi (Next.js).
2. Isi **semua environment variable** dari **.env.example** (Production & Preview).
3. Deploy → setelah sukses, arahkan domain custom sesuai langkah Cloudflare di atas.
4. **next.config.ts** sudah menyiapkan security headers & remotePatterns gambar (R2/Supabase).

## 🐙 Push ke GitHub

```bash
git init
git add .
git commit -m "feat: ACHO Coffee — fresh roasting on-demand"
gh auth login                       # atau git remote pakai token
gh repo create acho-coffee --public --source=. --push
```

## 📁 Struktur

```
src/
  app/
    page.tsx                    # landing + 3D journey
    kopi/                       # katalog
    pesan/[slug]/               # detail + order wizard
    pembayaran/[orderNumber]/   # pembayaran Doku
    status/…                    # lacak + status pesanan
    masuk/  akun/  admin/       # auth, dashboard, admin
    auth/callback/route.ts      # Google OAuth callback
    actions/auth.ts             # server actions auth
    api/                        # orders, payments, webhooks doku & biteship,
                                # pickup-slots, shipping, demo/pay, upload, health
  components/
    landing/roast-journey.tsx   # scene 3D (green→light→medium→grind→brew)
    order/order-builder.tsx     # wizard: roasting+rekomendasi, grind, jadwal, data
    order/status-timeline.tsx   # timeline proses
    payment/  admin/  account/  auth/  shop/  ui/   # panel & komponen
  db/        schema.ts + client Drizzle
  data/      seed katalog & profil roasting
  lib/       supabase, store pesanan (DB/memory), doku, biteship, email, r2, env
drizzle/0000_init.sql           # migrasi SQL siap pakai
```

## ⚙️ Skrip

| Perintah | Fungsi |
|---|---|
| **npm run dev** | Dev server |
| **npm run build** | Build produksi |
| **npm run db:generate** | Generate migrasi dari schema Drizzle |
| **npm run db:push** | Push schema ke database |
| **npm run db:studio** | Drizzle Studio |

## ✅ Checklist Produksi

- [ ] Ganti **DOKU_ENV=production** + Client ID/Shared Key produksi
- [ ] Ganti **BITESHIP_API_KEY** produksi
- [ ] **ADMIN_EMAILS** diisi email pemilik
- [ ] Domain custom + Cloudflare proxy aktif (SSL Full strict)
- [ ] Webhook Doku & Biteship didaftarkan ke URL produksi
- [ ] Resend domain terverifikasi
- [ ] Google OAuth di mode production (bukan testing)
- [ ] Foto produk asli diunggah ke R2 (saat ini pakai ilustrasi SVG bawaan)

---
Dibuat dengan ☕ dan ❤️ — ACHO Coffee Roastery, Bandung.
