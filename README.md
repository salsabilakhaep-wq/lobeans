# LOBEANS — Smart Inventory, Better Coffee.

Aplikasi **Warehouse & Coffee Inventory Management System** berbasis **Next.js (App Router)** dan **PostgreSQL** untuk mengelola persediaan biji kopi (*green bean*), pengadaan pasokan (*Restock Order / PO*), pengiriman supplier, pemeriksaan fisik barang, transaksi masuk/keluar, hingga laporan audit stok.

## Fitur Utama

- **Autentikasi & Keamanan Berstandar Industri**
  - Password hashing menggunakan `bcryptjs` saat registrasi dan verifikasi login.
  - Sesi berbasis `HttpOnly` JWT cookie (`jose`) dengan proteksi route dan pembatasan role di server melalui Next.js `middleware.js` (tanpa query database di middleware).
- **4 Peran Pengguna (Role-Based Access Control)**
  - **Admin**: Manajemen master data produk, kategori kopi, verifikasi mitra supplier baru, manajemen pengguna, dan laporan audit.
  - **Manager Gudang**: Pengelolaan produk & kategori (dengan proteksi alert pop-up jika stok masih tersisa), pembuatan Restock Order (PO) ke supplier, instruksi pemeriksaan fisik, persetujuan transaksi Barang Masuk (`IN`) & Barang Keluar (`OUT`) secara terpisah, serta keputusan retur/klaim refund.
  - **Staff Gudang**: Pemeriksaan fisik barang tiba beserta foto bukti wajib, pengajuan catatan Barang Masuk (`IN`) dari hasil pemeriksaan *Sesuai*, pembuatan transaksi Barang Keluar (`OUT`), dan konfirmasi pengiriman (`Shipped`) dengan foto bukti wajib.
  - **Supplier**: Konfirmasi/penolakan Restock Order (PO), pembaruan pengiriman (`In Transit` & `Arrived`) dengan foto bukti kirim/kedatangan wajib, serta pemantauan status pengiriman dan klaim retur.
- **Integritas & Aturan Stok Atomik**
  - Stok bertambah (`+`) secara atomik **hanya saat** transaksi `IN` disetujui Manager (`Approved`), sekaligus menandai PO menjadi `Received`.
  - Stok berkurang (`-`) secara atomik **hanya saat** Staff mengonfirmasi pengiriman barang keluar (`Shipped`).
  - Status stok otomatis: `Normal`, `Low`, `Severe`, dan `Out of Stock`.
- **Laporan & Ekspor CSV**
  - Laporan stok terkini, pergerakan stok (`stock_movements`), transaksi IN/OUT, dan audit log lengkap dengan fitur ekspor CSV.

## Teknologi

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (`pg`)
- **Keamanan & Validasi**: `bcryptjs`, `jose`, `zod`
- **Utilitas**: `qrcode` (label barcode SKU)

## Cara Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js 20+
- PostgreSQL 15+

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Salin `.env.example` menjadi `.env.local`, lalu sesuaikan kredensial PostgreSQL dan secret key Anda:
```bash
cp .env.example .env.local
```

Isi minimal `.env.local`:
```env
DATABASE_URL=postgres://postgres:PASSWORD_ANDA@localhost:5432/lobeans_db
AUTH_SECRET=isi-dengan-secret-acak-minimal-32-karakter
COOKIE_SECURE=false
APP_TZ=Asia/Makassar
```

### 4. Inisialisasi Database (Schema + Seed)
Jalankan perintah berikut untuk membuat database `lobeans_db`, menerapkan `database/schema.sql`, dan mengisi data awal dari `database/seed.sql`:
```bash
npm run db:reset
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka `http://localhost:3000` di browser Anda.

## Struktur Proyek

```text
├── app/
│   ├── (auth)/          # Halaman Login & Registrasi Supplier
│   ├── (app)/           # Halaman private (Dashboard, Produk, Kategori, PO, Pengiriman, Inspeksi, Transaksi, Laporan)
│   ├── actions/         # Next.js Server Actions
│   └── api/             # Route ekspor CSV laporan
├── components/          # Komponen UI reusable, form, workflow, & modal alert
├── database/
│   ├── schema.sql       # Struktur 17 tabel, indeks, & view v_products
│   ├── seed.sql         # Data awal & akun ter-hash bcryptjs
│   └── migrate.mjs      # Script migrasi otomatis (npm run db:reset)
├── lib/                 # DB pool, autentikasi JWT, validasi Zod, audit log, services
├── public/              # Aset statis (logo, ilustrasi kategori, placeholder)
└── middleware.js        # Next.js Middleware proteksi route & role
```
