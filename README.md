<div align="center">
  <img src="public/logo-mark.svg" alt="Logo LOBEANS" width="88" height="88" />
  <h1>LOBEANS</h1>
  <p><strong>Smart Inventory, Better Coffee.</strong></p>
  <p><em>Coffee Inventory &amp; Warehouse Management System untuk Biji Kopi Mentah (Green Bean) Nusantara</em></p>
</div>

---

## Navigasi Isi

Gunakan daftar isi berikut untuk langsung menuju bagian yang dibutuhkan:

| No | Bagian | Ringkasan Isi |
| :---: | :--- | :--- |
| 1 | [Tentang LOBEANS](#tentang-lobeans) | Gambaran umum aplikasi, latar belakang bisnis, dan tujuan sistem |
| 2 | [Fitur Utama](#fitur-utama) | Daftar fitur inti, keamanan autentikasi, dan aturan stok atomik |
| 3 | [Use Case Diagram](#use-case-diagram) | Diagram UML Use Case (Mermaid) & matriks aktivitas 5 aktor sistem |
| 4 | [Entity Relationship Diagram](#entity-relationship-diagram) | Diagram ERD lengkap 17 tabel PostgreSQL + view `v_products` |
| 5 | [Konfigurasi Parameter Terpusat](#konfigurasi-parameter-terpusat) | Pusat file konfigurasi untuk mengubah tampilan, animasi, dan aturan sistem |
| 6 | [Teknologi](#teknologi) | Stack teknologi frontend, backend, database, dan keamanan |
| 7 | [Cara Menjalankan Secara Lokal](#cara-menjalankan-secara-lokal) | Langkah instalasi, setup PostgreSQL, `.env.local`, dan menjalankan server |
| 8 | [Akun Demo](#akun-demo) | Kredensial akun uji untuk Admin, Manager, Staff, dan Supplier |
| 9 | [Struktur Proyek](#struktur-proyek) | Susunan folder `database/`, `public/`, dan `src/` |

---

## Tentang LOBEANS

**LOBEANS** (*Smart Inventory, Better Coffee.*) adalah platform **Coffee Inventory & Warehouse Management System** yang dirancang khusus untuk bisnis distribusi dan penyimpanan biji kopi mentah (*green bean*) Nusantara — mencakup varietas **Arabika** (Gayo & Toraja), **Robusta** (Dampit & Temanggung), **Liberika** (Tanjung Jabung, Jambi), dan **Excelsa** (Wonosalam & Jember).

Dalam bisnis kopi, kualitas seduhan sangat bergantung pada kesegaran biji, kestabilan kadar air (~12%), ketepatan sortasi mutu, dan keandalan pasokan dari koperasi petani ke roastery maupun kedai kopi. **LOBEANS** hadir untuk menggantikan pencatatan manual yang rawan selisih stok menjadi satu ekosistem digital yang terukur dan transparan:

- **Menghubungkan hulu ke hilir**: Mempertemukan **Koperasi/Mitra Supplier**, **Staff Gudang**, **Manager Gudang**, dan **Admin** dalam satu alur operasional terintegrasi.
- **Menjaga kualitas & traceability**: Setiap karung biji kopi tercatat jelas asal daerah, metode pascapanen, lokasi rak/silo, bukti pengiriman, serta dokumentasi pemeriksaan fisik.
- **Menjamin akurasi stok atomik**: Perubahan saldo stok hanya terjadi pada titik validasi resmi — mencegah selisih persediaan dan menjaga kelancaran pasokan untuk roastery.

---

## Fitur Utama

- **Landing Page Modern & Interaktif**
  - Desain bernuansa iOS dengan navbar kapsul transparan yang mengecil saat di-scroll menyisakan logo LOBEANS, animasi **GSAP + Motion + Lenis**, serta pengenalan keunggulan bisnis & asal kopi Nusantara.
- **Autentikasi & Keamanan Berstandar Industri**
  - Enkripsi kata sandi menggunakan `bcryptjs` saat registrasi, pembuatan akun, ubah kata sandi, dan verifikasi login.
  - Sesi berbasis `HttpOnly` JWT cookie (`jose`) dengan proteksi rute & pembatasan peran langsung di server melalui Next.js `src/middleware.js` (tanpa query database di middleware).
  - Seluruh query PostgreSQL menggunakan **Parameterized Query (`$1, $2, ...`)**, proteksi autentikasi file `/uploads`, validasi *magic bytes* gambar, proteksi *Open Redirect*, dan proteksi *CSV Formula Injection*.
- **4 Peran Pengguna (Role-Based Access Control)**
  - **Admin**: Tambah pengguna baru (**Staff Gudang**, **Manager Gudang**, dan **Supplier**), verifikasi mitra supplier pendaftar mandiri, kelola katalog produk & kategori kopi, serta pantau laporan audit.
  - **Manager Gudang**: Kelola produk & kategori (dengan alert pop-up proteksi penghapusan item berstok), buat *Restock Order (PO)* ke supplier, instruksikan pemeriksaan fisik, konfirmasi transaksi **Barang Masuk (`IN`)** & **Barang Keluar (`OUT`)** secara terpisah, serta tangani retur/klaim refund.
  - **Staff Gudang**: Lakukan pemeriksaan fisik barang tiba beserta foto bukti wajib, ajukan catatan **Barang Masuk (`IN`)** dari hasil pemeriksaan *Sesuai*, catat transaksi **Barang Keluar (`OUT`)**, dan konfirmasi pengiriman (`Shipped`) dengan foto bukti wajib.
  - **Supplier**: Konfirmasi/tolak *Restock Order (PO)*, perbarui pengiriman (`In Transit` & `Arrived`) dengan foto bukti kirim/kedatangan wajib, pantau status pengiriman & retur, serta **Kelola Akun** (ubah profil usaha, dokumen legalitas, dan kata sandi mandiri).
- **Integritas & Aturan Stok Atomik**
  - Stok bertambah (`+`) secara atomik **hanya saat** transaksi `IN` disetujui Manager (`Approved`), sekaligus mengubah status PO menjadi `Received`.
  - Stok berkurang (`-`) secara atomik **hanya saat** Staff mengonfirmasi pengiriman barang keluar (`Shipped`).
  - Status peringatan stok otomatis via view `v_products`: `Normal`, `Low`, `Severe`, dan `Out of Stock`.
- **Laporan & Ekspor CSV**
  - Laporan stok terkini, buku besar pergerakan stok (`stock_movements`), transaksi IN/OUT, dan audit trail (`activity_logs`) lengkap dengan ekspor CSV.

---

## Use Case Diagram

Diagram berikut menggambarkan seluruh interaksi antara **5 aktor** (*Guest*, *Admin*, *Manager Gudang*, *Staff Gudang*, dan *Supplier*) dengan fitur-fitur utama pada sistem **LOBEANS**.

```mermaid
flowchart LR
    %% Daftar Aktor
    GUEST(["👤 Guest / Pengunjung"])
    ADMIN(["👤 Admin"])
    MANAGER(["👤 Manager Gudang"])
    STAFF(["👤 Staff Gudang"])
    SUPPLIER(["👤 Supplier"])

    %% Batas Sistem LOBEANS
    subgraph SYSTEM["Sistem LOBEANS — Coffee Inventory & Warehouse Management"]
        direction TB

        subgraph AUTH["Akses & Autentikasi"]
            UC1(["Lihat Landing Page & Profil Origin"])
            UC2(["Daftar Akun Mitra Supplier"])
            UC3(["Login & Logout JWT Session"])
            UC4(["Lihat Dashboard & Notifikasi"])
        end

        subgraph MASTER["Manajemen Akun & Master Data"]
            UC5(["Kelola & Tambah Akun User"])
            UC6(["Verifikasi Pendaftaran Supplier"])
            UC7(["Kelola Kategori Kopi"])
            UC8(["Kelola Katalog Produk & Barcode SKU"])
            UC9(["Kelola Akun & Ubah Password Supplier"])
        end

        subgraph SUPPLY["Pengadaan & Pemeriksaan Fisik"]
            UC10(["Buat & Kelola Restock Order PO"])
            UC11(["Konfirmasi / Tolak PO"])
            UC12(["Kirim Barang & Unggah Bukti In Transit / Arrived"])
            UC13(["Instruksikan Pemeriksaan Fisik"])
            UC14(["Lakukan Pemeriksaan Fisik & Unggah Foto"])
            UC15(["Tolak Penerimaan / Retur & Klaim Refund"])
        end

        subgraph TRX["Transaksi Stok & Pelaporan"]
            UC16(["Ajukan Transaksi Barang Masuk IN"])
            UC17(["Buat / Edit Transaksi Barang Keluar OUT"])
            UC18(["Setujui / Tolak Transaksi IN & OUT"])
            UC19(["Konfirmasi Kirim Barang Keluar Shipped"])
            UC20(["Lihat Laporan, Audit Log & Ekspor CSV"])
        end
    end

    %% Relasi Guest
    GUEST --> UC1
    GUEST --> UC2
    GUEST --> UC3

    %% Relasi Admin
    ADMIN --> UC3
    ADMIN --> UC4
    ADMIN --> UC5
    ADMIN --> UC6
    ADMIN --> UC7
    ADMIN --> UC8
    ADMIN --> UC20

    %% Relasi Manager Gudang
    MANAGER --> UC3
    MANAGER --> UC4
    MANAGER --> UC7
    MANAGER --> UC8
    MANAGER --> UC10
    MANAGER --> UC13
    MANAGER --> UC15
    MANAGER --> UC18
    MANAGER --> UC20

    %% Relasi Staff Gudang
    STAFF --> UC3
    STAFF --> UC4
    STAFF --> UC14
    STAFF --> UC16
    STAFF --> UC17
    STAFF --> UC19

    %% Relasi Supplier
    SUPPLIER --> UC3
    SUPPLIER --> UC4
    SUPPLIER --> UC9
    SUPPLIER --> UC11
    SUPPLIER --> UC12
```

### Matriks Use Case per Aktor

| Aktor | Use Case Utama | Rute Utama |
| :--- | :--- | :--- |
| **Guest / Pengunjung** | Melihat landing page bisnis & origin kopi Nusantara, mendaftar sebagai mitra supplier baru (dengan dokumen legalitas), dan login ke sistem. | `/`, `/register`, `/login` |
| **Admin** | Menambah akun Staff/Manager/Supplier, mengaktifkan/menonaktifkan akun, menyetujui/menolak pendaftaran supplier baru, mengelola kategori & produk kopi, memantau laporan & audit trail, serta ekspor CSV. | `/dashboard`, `/users`, `/suppliers`, `/products`, `/categories`, `/reports` |
| **Manager Gudang** | Mengelola kategori & produk kopi, membuat *Restock Order (PO)* ke supplier, menginstruksikan pemeriksaan fisik ke staff, menyetujui/menolak transaksi `IN` (menambah stok atomik) & `OUT`, memproses retur/refund barang tidak sesuai, serta ekspor CSV laporan. | `/dashboard`, `/supply-orders`, `/transactions/in`, `/transactions/out`, `/products`, `/categories`, `/reports` |
| **Staff Gudang** | Melakukan pemeriksaan fisik barang tiba beserta foto bukti wajib, mengajukan transaksi Barang Masuk (`IN`) dari hasil inspeksi *Sesuai*, membuat/mengedit transaksi Barang Keluar (`OUT`) berstatus *Pending*, dan menyelesaikan pengiriman (`Shipped`, mengurangi stok atomik). | `/dashboard`, `/inspections`, `/transactions/in`, `/transactions/out`, `/products` |
| **Supplier** | Melihat & mengonfirmasi/menolak PO dari Manager, mengirim barang (`In Transit`) & melaporkan kedatangan (`Arrived`) beserta foto bukti wajib, memantau status pengiriman & klaim retur, serta memperbarui profil usaha dan kata sandi mandiri. | `/dashboard`, `/supply-orders`, `/shipments`, `/account` |

---

## Entity Relationship Diagram

Basis data **LOBEANS** dibangun di atas **PostgreSQL** dengan **17 tabel relasional** dan **1 view otomatis (`v_products`)** sebagaimana didefinisikan di [`database/schema.sql`](database/schema.sql).

```mermaid
erDiagram
    roles ||--o{ users : "memiliki"
    suppliers ||--o| users : "terhubung_1_ke_1"
    categories ||--o{ products : "mengelompokkan"

    suppliers ||--o{ supply_orders : "menerima_po"
    users ||--o{ supply_orders : "membuat_dan_memutuskan"
    supply_orders ||--|{ supply_order_items : "berisi"
    products ||--o{ supply_order_items : "dipesan_dalam"

    supply_orders ||--o{ shipments : "dikirim_melalui"
    users ||--o{ shipments : "membuat"
    shipments ||--o| inspections : "diperiksa_pada"
    users ||--o{ inspections : "menginstruksi_memeriksa"
    inspections ||--|{ inspection_items : "mencatat_hasil"
    products ||--o{ inspection_items : "diperiksa_fisik"
    inspections ||--|{ inspection_photos : "dilampiri_foto"
    users ||--o{ inspection_photos : "mengunggah"

    shipments ||--o| returns : "diretur_pada"
    supply_orders ||--o{ returns : "referensi_retur"
    users ||--o{ returns : "menginisiasi_konfirmasi"

    inspections ||--o| inventory_transactions : "menghasilkan_trx_in"
    supply_orders ||--o{ inventory_transactions : "referensi_po"
    shipments ||--o{ inventory_transactions : "referensi_shipment"
    suppliers ||--o{ inventory_transactions : "sumber_supplier"
    users ||--o{ inventory_transactions : "membuat_menyetujui_kirim"
    inventory_transactions ||--|{ inventory_transaction_items : "berisi_item"
    products ||--o{ inventory_transaction_items : "digerakkan_dalam"

    products ||--o{ stock_movements : "riwayat_stok"
    inventory_transactions ||--o{ stock_movements : "sumber_pergerakan"
    users ||--o{ stock_movements : "aktor_perubahan"

    users ||--o{ notifications : "menerima"
    users ||--o{ activity_logs : "mencatat_aktivitas"

    roles {
        int id PK
        varchar code UK
        varchar name
        text description
    }

    suppliers {
        int id PK
        varchar supplier_code UK
        varchar company_name
        varchar contact_name
        varchar phone
        varchar email
        text address
        text document_url
        varchar verification_status
        text reject_reason
        boolean is_active
        timestamptz created_at
    }

    users {
        int id PK
        int role_id FK
        int supplier_id FK
        varchar name
        varchar email UK
        text password_hash
        boolean is_active
        timestamptz created_at
    }

    categories {
        int id PK
        varchar name UK
        text description
        text image_url
        boolean is_active
    }

    products {
        int id PK
        varchar sku UK
        varchar name
        int category_id FK
        varchar variety
        varchar process_method
        varchar origin_region
        numeric buy_price
        numeric sell_price
        numeric min_stock
        numeric low_stock
        numeric stock
        varchar unit
        varchar rack_location
        text image_url
        boolean is_active
    }

    supply_orders {
        int id PK
        varchar order_number UK
        int supplier_id FK
        int created_by FK
        date order_date
        date expected_date
        text notes
        varchar status
        int decision_by FK
        timestamptz decision_at
        text reject_reason
    }

    supply_order_items {
        int id PK
        int supply_order_id FK
        int product_id FK
        numeric quantity
    }

    shipments {
        int id PK
        varchar shipment_number UK
        int supply_order_id FK
        int attempt_number
        varchar shipment_type
        varchar status
        text shipping_proof_url
        text arrival_proof_url
        timestamptz shipped_at
        timestamptz arrived_at
        int created_by FK
    }

    inspections {
        int id PK
        int shipment_id FK
        int instructed_by FK
        int inspector_id FK
        varchar status
        varchar overall_result
        text notes
        varchar manager_decision
        int decision_by FK
        text decision_notes
    }

    inspection_items {
        int id PK
        int inspection_id FK
        int product_id FK
        numeric ordered_qty
        numeric actual_qty
        varchar result
    }

    inspection_photos {
        int id PK
        int inspection_id FK
        text image_url
        text caption
        int uploaded_by FK
    }

    returns {
        int id PK
        int shipment_id FK
        int supply_order_id FK
        text reason
        text instructions
        varchar status
        int initiated_by FK
        int confirmed_by FK
        timestamptz returned_at
    }

    inventory_transactions {
        int id PK
        varchar trx_number UK
        varchar type
        date trx_date
        int inspection_id FK
        int supply_order_id FK
        int shipment_id FK
        int supplier_id FK
        varchar recipient_name
        text destination
        text proof_image_url
        varchar status
        text reject_reason
        int created_by FK
        int approved_by FK
        int shipped_by FK
    }

    inventory_transaction_items {
        int id PK
        int transaction_id FK
        int product_id FK
        numeric quantity
    }

    stock_movements {
        int id PK
        int product_id FK
        int transaction_id FK
        varchar movement_type
        numeric quantity_change
        numeric stock_before
        numeric stock_after
        int actor_id FK
        text notes
        timestamptz created_at
    }

    notifications {
        int id PK
        int user_id FK
        varchar title
        text message
        varchar link
        boolean is_read
        timestamptz created_at
    }

    activity_logs {
        int id PK
        int actor_id FK
        varchar actor_role
        varchar action
        varchar entity_type
        int entity_id
        text summary
        timestamptz created_at
    }
```

### Ringkasan Kelompok Entitas Database

| Kelompok | Tabel / View | Fungsi Utama |
|---|---|---|
| **Autentikasi & Mitra** | `roles`, `users`, `suppliers` | Manajemen 4 peran pengguna, akun ter-hash `bcryptjs`, dan profil koperasi/mitra supplier (relasi 1:1 opsional ke `users`). |
| **Katalog Persediaan** | `categories`, `products`, `v_products` *(view)* | Master kategori kopi (Arabika, Robusta, Liberika, Excelsa), detail produk green bean, serta perhitungan otomatis status stok (`normal`, `low`, `severe`, `out_of_stock`). |
| **Pengadaan & Pengiriman** | `supply_orders`, `supply_order_items`, `shipments` | Siklus Restock Order (PO) dari Manager ke Supplier beserta pelacakan pengiriman (`in_transit` → `arrived` → `inspecting` → `received` / `returned`). |
| **Inspeksi & Retur** | `inspections`, `inspection_items`, `inspection_photos`, `returns` | Pemeriksaan fisik barang oleh Staff beserta foto bukti wajib, serta pencatatan retur & klaim refund jika hasil *Tidak Sesuai*. |
| **Transaksi & Ledger Stok** | `inventory_transactions`, `inventory_transaction_items`, `stock_movements` | Pencatatan transaksi `IN` & `OUT` dan buku besar mutasi stok (*append-only*) saat `IN Approved` (+) dan `OUT Shipped` (-). |
| **Notifikasi & Audit** | `notifications`, `activity_logs` | Pemberitahuan real-time antar peran dan jejak audit seluruh aktivitas sistem. |

---

## Konfigurasi Parameter Terpusat

Seluruh parameter yang sering disesuaikan telah dipisahkan ke 4 file konfigurasi agar mudah diedit tanpa membongkar banyak komponen:

| File Konfigurasi | Parameter yang Diatur |
| :--- | :--- |
| [`src/lib/landingConfig.js`](src/lib/landingConfig.js) | Konten teks & gambar Landing Page, menu navbar, batas scroll mengecil (`shrinkScrollY`), durasi smooth scroll **Lenis**, parallax/reveal **GSAP**, pegas **Motion**, dan link footer. |
| [`src/lib/appConfig.js`](src/lib/appConfig.js) | Durasi sesi login, minimal panjang password, batas ukuran & ekstensi upload, jumlah produk per halaman, batas baris laporan, prefix kode supplier (`SUP-`), dan toggle keamanan. |
| [`src/lib/constants.js`](src/lib/constants.js) | Label peran (`ROLE_LABEL`), daftar menu sidebar per role (`NAV`), metode proses kopi, satuan produk, dan status stok/transaksi. |
| [`src/middleware.js`](src/middleware.js) | Daftar rute publik (`PUBLIC_PATHS`), rute privat (`PRIVATE_PREFIXES`), dan aturan pembatasan akses per role (`ROLE_RULES`). |

---

## Teknologi

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling & Animasi**: Tailwind CSS v4, GSAP, Motion (`motion/react`), Lenis
- **Database**: PostgreSQL (`pg`)
- **Keamanan & Validasi**: `bcryptjs`, `jose`, `zod`, Next.js Middleware (`src/middleware.js`)
- **Kualitas Kode & Utilitas**: ESLint (`eslint-config-next`), `qrcode` (label barcode SKU)

---

## Cara Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js 20+
- PostgreSQL 15+ (serta pgAdmin 4 atau `psql`)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Setup Basis Data PostgreSQL
Buat database baru bernama `lobeans_db` lalu jalankan **`database/schema.sql`** diikuti **`database/seed.sql`** melalui **pgAdmin 4** atau terminal `psql`:

```bash
psql -U postgres -c "CREATE DATABASE lobeans_db;"
psql -U postgres -d lobeans_db -f database/schema.sql
psql -U postgres -d lobeans_db -f database/seed.sql
```

Panduan langkah demi langkah menggunakan **pgAdmin 4** tersedia lengkap di [`database/README.md`](database/README.md).

### 4. Konfigurasi Environment
Salin `.env.example` menjadi `.env.local`, lalu sesuaikan kredensial PostgreSQL Anda:
```bash
cp .env.example .env.local
```

Isi minimal `.env.local`:
```env
DATABASE_URL=postgres://postgres:PASSWORD_POSTGRES_ANDA@localhost:5432/lobeans_db
AUTH_SECRET=lobeans-dev-secret-key-32chars-minimum-ok
COOKIE_SECURE=false
APP_TZ=Asia/Makassar
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka `http://localhost:3000` di browser Anda. Untuk mengecek kualitas kode dengan ESLint:
```bash
npm run lint
```

---

## Akun Demo

Setelah menjalankan `database/seed.sql`, gunakan akun berikut untuk pengujian tiap peran di `/login`:

| Peran (Role) | Nama | Email | Password | Status |
|---|---|---|---|---|
| **Admin** | Salsabila Khaerani Putricia | `admin@lobeans.test` | `Admin123!` | Aktif |
| **Manager Gudang** | Zahrana Kumayla Irfan | `manager@lobeans.test` | `Manager123!` | Aktif |
| **Staff Gudang** | Ahmad Fauzi Ali | `staff@lobeans.test` | `Staff123!` | Aktif |
| **Supplier 1** | Prabowo Susanto | `supplier1@lobeans.test` | `Supplier123!` | Aktif |
| **Supplier 2** | Uzumaki Naruto | `supplier2@lobeans.test` | `Supplier123!` | Aktif |
| **Supplier 3** | Peter Parker | `supplier3@lobeans.test` | `Supplier123!` | Pending Verifikasi Admin |

---

## Struktur Proyek

```text
├── database/
│   ├── schema.sql           # Struktur 17 tabel, indeks, & view v_products
│   ├── seed.sql             # Data awal & akun demo ter-hash bcryptjs
│   └── README.md            # Panduan setup PostgreSQL (pgAdmin 4 / psql) & akun demo
├── public/                  # Aset statis (logo-mark.svg, latar hero, ilustrasi kategori)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Halaman Login & Registrasi Supplier
│   │   ├── (app)/           # Halaman private (Dashboard, Akun Supplier, Pengguna, Produk, Kategori, PO, Pengiriman, Inspeksi, Transaksi, Laporan)
│   │   ├── actions/         # Next.js Server Actions
│   │   ├── api/             # Route ekspor CSV laporan
│   │   └── uploads/         # Route file upload terproteksi autentikasi
│   ├── components/          # Komponen UI reusable, landing page, form, workflow, & modal alert
│   ├── lib/
│   │   ├── appConfig.js     # Pusat parameter konfigurasi aplikasi internal & keamanan
│   │   ├── landingConfig.js # Pusat parameter konten, navigasi, & animasi Landing Page
│   │   ├── constants.js     # Label role, menu sidebar, status, & metode proses kopi
│   │   ├── services/        # Logika bisnis transaksi atomik (supply & transactions)
│   │   └── ...              # DB pool, JWT session, Zod validation, CSV, upload, audit log
│   └── middleware.js        # Next.js Middleware proteksi route & role
├── eslint.config.mjs        # Konfigurasi ESLint (eslint-config-next)
└── package.json
```
