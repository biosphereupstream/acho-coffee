# ACHO Coffee — Frontend (TypeScript / Next.js)

Aplikasi web storefront dan admin portal modern berbasis **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, dan **Drizzle ORM**.

---

## ☕ Fitur Aplikasi

- **Storefront Biji Kopi Sangrai (`/kopi`) & Minuman (`/minuman`)**:
  - Filter interaktif (proses pascapanen, packaging, profil rasa).
  - Micro-caching in-memory untuk waktu respon < 1ms.
  - Sinkronisasi status/stok otomatis dengan admin backend.
- **Custom Order Builder (`/pesan/[slug]`)**:
  - Pilihan 4 profil roasting presisi (Cinnamon, City+, Full City, French).
  - Pilihan grind size (Whole bean, Espresso, V60, Cold brew, dll) dan ukuran kemasan (100g, 200g, 250g, 500g, 1kg).
  - Simulasi kurva roasting real-time (*roast curve graph*).
- **Wholesale Portal (`/wholesale`)**:
  - Matriks pemesanan volume B2B dengan batas diskon otomatis maks 10%.
  - Formulir permintaan sampel beans roastery.
- **Keranjang & Checkout (`/checkout`)**:
  - Integrasi logistik multi-kurir Biteship (JNE, J&T, SiCepat, Anteraja, GoSend, GrabExpress).
  - Validasi voucher promo.
  - Gateway pembayaran DOKU (QRIS, VA BCA/Mandiri/BRI/BNI, e-Wallets, Kartu Kredit).
- **Portal Admin Roastery (`/admin`)**:
  - Proteksi login akun admin.
  - Dashboard analitik omzet & pesanan.
  - Manajemen pesanan (*dispatch, update tracking, status timeline*).
  - Manajemen katalog menu dengan fitur **Select All**, **Bulk Edit**, dan **Hapus**.
  - Manajemen inventaris stok bahan baku & log mutasi.
  - Manajemen pelanggan & promosi WhatsApp/Email.
  - Print bag labels & packing slip siap cetak.

---

## 🛠️ Menjalankan Frontend

### Dari Direktori `frontend/`
```bash
cd frontend
npm run dev
```

### Dari Root Monorepo
```bash
npm run dev
```

Kunjungi `http://localhost:3000`.

---

## 📦 Scripts Tersedia

- `npm run dev`: Menjalankan server development Next.js.
- `npm run build`: Melakukan compile dan build produksi teroptimasi.
- `npm run start`: Menjalankan server hasil build produksi.
- `npm run typecheck`: Validasi tipe TypeScript tanpa emit (`tsc --noEmit`).
- `npm run lint`: Pemeriksaan kode dengan ESLint.
- `npm run db:generate`: Generate migrasi SQL Drizzle.
- `npm run db:push`: Sinkronisasi skema langsung ke database.
- `npm run db:studio`: Membuka Drizzle Studio web GUI.
