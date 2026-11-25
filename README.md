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
| 3 | [Flowchart Alur Sistem](#flowchart-alur-sistem) | Flowchart lengkap alur autentikasi, pengadaan PO, inspeksi, retur, dan transaksi IN/OUT |
| 4 | [Matriks Hak Akses RBAC](#matriks-hak-akses-rbac) | Pembagian hak akses 4 peran (Admin, Manager, Staff, Supplier) & 3 lapis proteksi RBAC |
| 5 | [Entity Relationship Diagram](#entity-relationship-diagram) | Diagram ERD lengkap 17 tabel PostgreSQL + view `v_products` |
| 6 | [Konfigurasi Parameter Terpusat](#konfigurasi-parameter-terpusat) | Pusat file konfigurasi untuk mengubah tampilan, animasi, dan aturan sistem |
| 7 | [Teknologi](#teknologi) | Stack teknologi frontend, backend, database, dan keamanan |
| 8 | [Cara Menjalankan Secara Lokal](#cara-menjalankan-secara-lokal) | Langkah instalasi, setup PostgreSQL, `.env.local`, dan menjalankan server |
| 9 | [Akun Demo](#akun-demo) | Kredensial akun uji untuk Admin, Manager, Staff, dan Supplier |
| 10 | [Struktur Proyek](#struktur-proyek) | Susunan folder `public/` dan `src/` (termasuk `src/database/`) |

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

## Flowchart Alur Sistem

Flowchart berikut menggambarkan alur operasional lengkap pada sistem **LOBEANS**, mulai dari autentikasi & pendaftaran supplier, siklus pengadaan (*Restock Order / PO*) beserta cabang pemeriksaan fisik (**Sesuai** vs **Tidak Sesuai / Retur**), hingga pengeluaran barang (**Barang Keluar / OUT**).

```mermaid
flowchart TD
    START(["Mulai / Akses Aplikasi LOBEANS"]) --> AUTH_CHECK{"Sudah Punya Akun Aktif?"}

    %% Cabang Registrasi Supplier
    AUTH_CHECK -- "Belum (Mitra Supplier)" --> REG["Daftar Mandiri di /register + Unggah Dokumen Legalitas"]
    REG --> VERIF_ADMIN{"Admin Verifikasi di /suppliers"}
    VERIF_ADMIN -- "Ditolak + Alasan" --> REJECT_SUP(["Status: Rejected — Akun Nonaktif"])
    VERIF_ADMIN -- "Disetujui" --> LOGIN["Login di /login (Verifikasi bcryptjs + JWT Cookie)"]

    %% Cabang Login & Role Routing
    AUTH_CHECK -- "Sudah" --> LOGIN
    LOGIN --> ROLE{"Arahkan Berdasarkan Role (Middleware)"}

    %% Alur Admin
    ROLE -- "Admin" --> ADMIN_FLOW["Kelola Akun User, Verifikasi Supplier, Master Produk & Kategori, Laporan & Audit"]

    %% Alur Pengadaan (PO -> Pengiriman -> Inspeksi -> IN / Retur)
    ROLE -- "Manager Gudang" --> PO_CREATE["Buat Restock Order / PO (Status: Pending)"]
    PO_CREATE --> SUP_DECIDE{"Supplier Konfirmasi PO"}
    SUP_DECIDE -- "Tolak + Alasan" --> PO_REJECT(["PO Rejected — Alur Selesai"])
    SUP_DECIDE -- "Konfirmasi" --> PO_CONF["PO Confirmed"]
    PO_CONF --> SUP_SHIP["Supplier Kirim Barang + Foto Bukti Kirim (In Transit)"]
    SUP_SHIP --> SUP_ARR["Supplier Lapor Tiba + Foto Kedatangan (Arrived)"]
    SUP_ARR --> MGR_INST["Manager Instruksikan Pemeriksaan Fisik (Inspecting)"]
    MGR_INST --> STAFF_INSP["Staff Periksa Fisik & Unggah Foto Bukti"]
    STAFF_INSP --> INSP_RES{"Hasil Pemeriksaan Fisik?"}

    %% Skenario 1: Sesuai -> Barang Masuk IN -> Stok +
    INSP_RES -- "Sesuai" --> TRX_IN_CREATE["Staff Ajukan Transaksi Barang Masuk / IN (Pending)"]
    TRX_IN_CREATE --> MGR_IN_DEC{"Manager Konfirmasi Barang Masuk (IN)"}
    MGR_IN_DEC -- "Tolak + Alasan" --> IN_REJECT(["TRX-IN Rejected — Stok Tidak Berubah"])
    MGR_IN_DEC -- "Setujui (Approved)" --> STOCK_ADD(["Stok Bertambah (+) Atomik + Catat Stock Movement + PO Received"])

    %% Skenario 2: Tidak Sesuai -> Retur & Klaim Refund
    INSP_RES -- "Tidak Sesuai / Rusak" --> MGR_RET["Manager Tolak Penerimaan & Ajukan Klaim Refund"]
    MGR_RET --> PO_RET(["PO & Shipment Returned — Stok Tidak Berubah"])

    %% Alur Barang Keluar (OUT)
    ROLE -- "Staff Gudang" --> OUT_CREATE["Staff Buat Transaksi Barang Keluar / OUT (Pending)"]
    OUT_CREATE --> MGR_OUT_DEC{"Manager Konfirmasi Barang Keluar (OUT)"}
    MGR_OUT_DEC -- "Tolak + Alasan" --> OUT_REJECT(["TRX-OUT Rejected — Stok Tidak Berubah"])
    MGR_OUT_DEC -- "Setujui (Approved)" --> PACK["Staff Packing & Unggah Foto Bukti Pengiriman"]
    PACK --> SHIPPED(["Klik Kirim Barang (Shipped) — Stok Berkurang (-) Atomik + Catat Stock Movement"])

    %% Alur Supplier Mandiri
    ROLE -- "Supplier" --> SUP_PORTAL["Pantau PO, Pengiriman, Klaim Retur & Kelola Akun di /account"]
```

### Ringkasan Tahapan Utama pada Flowchart

| Alur | Pelaku Utama | Perubahan Stok |
| :--- | :--- | :--- |
| **Registrasi & Verifikasi Supplier** | Guest → Admin | Tidak mengubah stok |
| **Pengadaan PO (`Pending` → `Confirmed` → `In Transit` → `Arrived` → `Inspecting`)** | Manager → Supplier → Staff | Tidak mengubah stok |
| **Barang Masuk `IN` (`Sesuai` → `Pending` → `Approved`)** | Staff → Manager | **Stok Bertambah (`+`)** atomik saat `Approved` + PO menjadi `Received` |
| **Retur & Klaim Refund (`Tidak Sesuai` → `Returned`)** | Staff → Manager → Supplier | Tidak mengubah stok |
| **Barang Keluar `OUT` (`Pending` → `Approved` → `Shipped`)** | Staff → Manager → Staff | **Stok Berkurang (`-`)** atomik saat `Shipped` |

---

## Matriks Hak Akses RBAC

**LOBEANS** menerapkan **Role-Based Access Control (RBAC)** untuk memisahkan kewenangan **4 peran** (*Admin*, *Manager Gudang*, *Staff Gudang*, dan *Supplier*) secara ketat agar tidak terjadi tumpang tindih tanggung jawab maupun manipulasi stok.

### Matriks Kewenangan per Modul & Rute

| Modul / Fitur | Rute Utama | Admin | Manager Gudang | Staff Gudang | Supplier |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Dashboard & Notifikasi** | `/dashboard`, `/notifications` | ✅ | ✅ | ✅ | ✅ |
| **Kelola & Tambah Akun User** | `/users`, `/users/new` | ✅ Penuh | ❌ | ❌ | ❌ |
| **Verifikasi & Kelola Mitra Supplier** | `/suppliers`, `/suppliers/new` | ✅ Penuh | ❌ | ❌ | ❌ |
| **Kelola Kategori Kopi (CRUD)** | `/categories`, `/categories/new` | ✅ Penuh | ✅ Penuh | ❌ | ❌ |
| **Katalog Produk & Barcode SKU** | `/products`, `/products/[id]` | ✅ CRUD | ✅ CRUD + `+ Permintaan PO` | 👁️ Lihat Stok | ❌ |
| **Restock Order / PO** | `/supply-orders` | 👁️ Lihat | ✅ Buat, Hapus Pending, Instruksi, Retur | 👁️ Lihat | ✅ Milik Sendiri *(Konfirmasi/Tolak, Kirim, Tiba)* |
| **Pengiriman Barang** | `/shipments` | 👁️ Pantau | 👁️ Pantau | ❌ | ✅ Milik Sendiri |
| **Pemeriksaan Fisik Barang** | `/inspections` | 👁️ Pantau | 👁️ Pantau | ✅ Periksa + Foto Wajib | ❌ |
| **Transaksi Barang Masuk (`IN`)** | `/transactions/in` | 👁️ Lihat | ✅ Setujui *(Stok `+`)* / Tolak | ✅ Ajukan *(hasil Sesuai)* | ❌ |
| **Transaksi Barang Keluar (`OUT`)** | `/transactions/out` | 👁️ Lihat | ✅ Setujui / Tolak | ✅ Buat/Edit/Hapus Pending + `Shipped` *(Stok `-`)* | ❌ |
| **Laporan & Audit Trail** | `/reports` | ✅ Penuh | ✅ Operasional | ❌ | ❌ |
| **Ekspor CSV** | `/api/export/[module]` | ✅ Semua *(6 modul)* | ✅ Produk, Mutasi, Transaksi, PO | ⚠️ Transaksi milik sendiri | ❌ |
| **Kelola Akun & Password Mandiri** | `/account` | ❌ | ❌ | ❌ | ✅ Profil, Dokumen & Password |

> **Keterangan:** `✅` Akses penuh / aksi sesuai peran · `👁️` Hanya baca (*read-only*) · `⚠️` Terbatas data milik sendiri · `❌` Ditolak (*redirect* ke `/dashboard` atau `403 Forbidden`).

### 3 Lapis Penegakan RBAC di Sistem

1. **Lapis 1 — Edge Middleware ([`src/middleware.js`](src/middleware.js))**: Memverifikasi tanda tangan JWT pada cookie `HttpOnly` (`lobeans_session`) dan mencocokkan rute terhadap `PRIVATE_PREFIXES` & `ROLE_RULES` sebelum halaman/API dirender.
2. **Lapis 2 — Server-Side Guard ([`src/lib/auth.js`](src/lib/auth.js))**: Setiap halaman privat dan Server Action memanggil `requireUser([...roles])` yang memverifikasi ulang status aktif (`is_active = TRUE`) dan role terbaru langsung dari PostgreSQL.
3. **Lapis 3 — Isolasi Kepemilikan Data (*Ownership Guard*)**: Supplier hanya dapat mengakses PO dan pengiriman miliknya (`supplier_id = user.supplier_id`), sedangkan Staff hanya dapat mengubah/menghapus transaksi `Pending` buatannya sendiri (`created_by = user.id`).

---

## Entity Relationship Diagram

Basis data **LOBEANS** dibangun di atas **PostgreSQL** dengan **17 tabel relasional** dan **1 view otomatis (`v_products`)** sebagaimana didefinisikan di [`src/database/schema.sql`](src/database/schema.sql).

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
        timestamptz updated_at
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
        timestamptz updated_at
    }

    categories {
        int id PK
        varchar name UK
        text description
        text image_url
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    products {
        int id PK
        varchar sku UK
        varchar name
        int category_id FK
        varchar variety
        varchar process_method
        varchar origin_region
        text description
        numeric buy_price
        numeric sell_price
        numeric min_stock
        numeric low_stock
        numeric stock
        varchar unit
        varchar rack_location
        text image_url
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
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
        timestamptz created_at
        timestamptz updated_at
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
        text notes
        timestamptz shipped_at
        timestamptz arrived_at
        int created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    inspections {
        int id PK
        int shipment_id FK
        int instructed_by FK
        timestamptz instructed_at
        int inspector_id FK
        varchar status
        varchar overall_result
        text notes
        timestamptz submitted_at
        varchar manager_decision
        int decision_by FK
        timestamptz decision_at
        text decision_notes
        timestamptz created_at
        timestamptz updated_at
    }

    inspection_items {
        int id PK
        int inspection_id FK
        int product_id FK
        numeric ordered_qty
        numeric actual_qty
        varchar result
        text notes
    }

    inspection_photos {
        int id PK
        int inspection_id FK
        text image_url
        text caption
        int uploaded_by FK
        timestamptz created_at
    }

    returns {
        int id PK
        int shipment_id FK
        int supply_order_id FK
        text reason
        text instructions
        varchar status
        int initiated_by FK
        timestamptz returned_at
        int confirmed_by FK
        text notes
        timestamptz created_at
        timestamptz updated_at
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
        text notes
        text proof_image_url
        varchar status
        text reject_reason
        int created_by FK
        int approved_by FK
        timestamptz decided_at
        timestamptz shipped_at
        int shipped_by FK
        timestamptz created_at
        timestamptz updated_at
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
- Git
- Node.js 20+
- PostgreSQL 15+ (serta pgAdmin 4 atau `psql`)

### 2. Clone Repository
```bash
git clone https://github.com/salsabilakhaep-wq/lobeans.git
cd lobeans
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Setup Basis Data PostgreSQL
Buat database baru bernama `lobeans_db` lalu jalankan **`src/database/schema.sql`** diikuti **`src/database/seed.sql`** melalui **pgAdmin 4** atau terminal `psql`:

```bash
psql -U postgres -c "CREATE DATABASE lobeans_db;"
psql -U postgres -d lobeans_db -f src/database/schema.sql
psql -U postgres -d lobeans_db -f src/database/seed.sql
# Opsional: tambah skenario dummy lengkap untuk demo presentasi
psql -U postgres -d lobeans_db -f src/database/demo_dummy.sql
```

Panduan langkah demi langkah menggunakan **pgAdmin 4** tersedia lengkap di [`src/database/README.md`](src/database/README.md).

### 5. Konfigurasi Environment
Salin `.env.example` menjadi `.env.local`, lalu sesuaikan kredensial PostgreSQL Anda:
```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows (CMD / PowerShell)
copy .env.example .env.local
```

Isi minimal `.env.local`:
```env
DATABASE_URL=postgres://postgres:PASSWORD_POSTGRES_ANDA@localhost:5432/lobeans_db
AUTH_SECRET=lobeans-dev-secret-key-32chars-minimum-ok
COOKIE_SECURE=false
APP_TZ=Asia/Makassar
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka `http://localhost:3000` di browser Anda. Untuk mengecek kualitas kode dengan ESLint:
```bash
npm run lint
```

---

## Akun Demo

Setelah menjalankan `src/database/seed.sql`, gunakan akun berikut untuk pengujian tiap peran di `/login`:

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
├── public/                  # Aset statis (logo-mark.svg, latar hero, ilustrasi kategori)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Halaman Login & Registrasi Supplier
│   │   ├── (app)/           # Halaman private (Dashboard, Akun Supplier, Pengguna, Produk, Kategori, PO, Pengiriman, Inspeksi, Transaksi, Laporan)
│   │   ├── actions/         # Next.js Server Actions
│   │   ├── api/             # Route ekspor CSV laporan
│   │   └── uploads/         # Route file upload terproteksi autentikasi
│   ├── components/          # Komponen UI reusable, landing page, form, workflow, & modal alert
│   ├── database/
│   │   ├── schema.sql       # Struktur 17 tabel, indeks, & view v_products
│   │   ├── seed.sql         # Data awal & akun demo ter-hash bcryptjs
│   │   ├── demo_dummy.sql   # Data dummy tambahan (additive & idempotent) untuk demo presentasi
│   │   └── README.md        # Panduan setup PostgreSQL (pgAdmin 4 / psql) & akun demo
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
