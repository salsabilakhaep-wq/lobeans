-- =====================================================================
--  LOBEANS — Smart Inventory, Better Coffee.
--  FILE 1/2 : SCHEMA DATABASE LOBEANS (17 Entitas + View v_products)
-- =====================================================================

BEGIN;

DROP VIEW IF EXISTS v_products;
DROP TABLE IF EXISTS
  activity_logs,
  notifications,
  stock_movements,
  inventory_transaction_items,
  inventory_transactions,
  returns,
  inspection_photos,
  inspection_items,
  inspections,
  shipments,
  supply_order_items,
  supply_orders,
  products,
  categories,
  users,
  suppliers,
  roles,
  -- Bersihkan tabel versi lama jika masih ada
  transaction_items,
  transactions,
  restock_items,
  restock_orders
CASCADE;

DROP SEQUENCE IF EXISTS seq_supply_order, seq_shipment, seq_trx_in, seq_trx_out, seq_po;

-- ---------------------------------------------------------------------
-- 1. ROLES
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(30)  NOT NULL UNIQUE CHECK (code IN ('admin', 'manager', 'staff', 'supplier')),
  name        VARCHAR(60)  NOT NULL,
  description TEXT         NOT NULL
);

-- ---------------------------------------------------------------------
-- 2. SUPPLIERS (Profil badan usaha/kelompok tani/koperasi)
-- ---------------------------------------------------------------------
CREATE TABLE suppliers (
  id                  SERIAL PRIMARY KEY,
  supplier_code       VARCHAR(30)  NOT NULL UNIQUE,
  company_name        VARCHAR(150) NOT NULL,
  contact_name        VARCHAR(100) NOT NULL,
  phone               VARCHAR(30)  NOT NULL,
  email               VARCHAR(150) NOT NULL,
  address             TEXT         NOT NULL DEFAULT '',
  document_url        TEXT,
  verification_status VARCHAR(20)  NOT NULL DEFAULT 'approved'
                        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  reject_reason       TEXT,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. USERS (Terhubung ke roles & opsional 1:1 ke suppliers)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  role_id       INT          NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  supplier_id   INT          UNIQUE REFERENCES suppliers(id) ON DELETE RESTRICT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users (role_id);

-- ---------------------------------------------------------------------
-- 4. CATEGORIES (Arabika, Robusta, Liberika, Excelsa)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT         NOT NULL,
  image_url   TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. PRODUCTS (Satuan kg numerik, soft-delete via is_active)
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id             SERIAL PRIMARY KEY,
  sku            VARCHAR(50)    NOT NULL UNIQUE,
  name           VARCHAR(150)   NOT NULL,
  category_id    INT            NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  variety        VARCHAR(100)   NOT NULL,
  process_method VARCHAR(50)    NOT NULL DEFAULT 'Semi-Washed',
  origin_region  VARCHAR(100)   NOT NULL,
  description    TEXT           NOT NULL,
  buy_price      NUMERIC(14,2)  NOT NULL CHECK (buy_price  >= 0),
  sell_price     NUMERIC(14,2)  NOT NULL CHECK (sell_price >= 0),
  min_stock      NUMERIC(12,2)  NOT NULL CHECK (min_stock  >= 0),
  low_stock      NUMERIC(12,2)  NOT NULL CHECK (low_stock  >= 0),
  stock          NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit           VARCHAR(20)    NOT NULL DEFAULT 'kg',
  rack_location  VARCHAR(50)    NOT NULL,
  image_url      TEXT,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_low_gt_min CHECK (low_stock > min_stock)
);
CREATE INDEX idx_products_category ON products (category_id);

-- View status stok otomatis (Out of Stock / Severe / Low / Normal)
CREATE VIEW v_products AS
SELECT p.*,
       c.name AS category_name,
       CASE
         WHEN p.stock = 0            THEN 'out_of_stock'
         WHEN p.stock <= p.min_stock THEN 'severe'
         WHEN p.stock <= p.low_stock THEN 'low'
         ELSE 'normal'
       END AS stock_status
FROM products p
JOIN categories c ON c.id = p.category_id;

-- ---------------------------------------------------------------------
-- SEQUENCES NOMOR DOKUMEN
-- ---------------------------------------------------------------------
CREATE SEQUENCE seq_supply_order START 1;
CREATE SEQUENCE seq_shipment     START 1;
CREATE SEQUENCE seq_trx_in       START 1;
CREATE SEQUENCE seq_trx_out      START 1;

-- ---------------------------------------------------------------------
-- 6. SUPPLY ORDERS (Pengajuan Pasokan oleh Supplier -> Keputusan Manager)
-- ---------------------------------------------------------------------
CREATE TABLE supply_orders (
  id            SERIAL PRIMARY KEY,
  order_number  VARCHAR(30)  NOT NULL UNIQUE,
  supplier_id   INT          NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  created_by    INT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE         NOT NULL,
  notes         TEXT         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'rejected', 'in_transit', 'arrived', 'inspecting', 'received', 'returned')),
  decision_by   INT          REFERENCES users(id) ON DELETE SET NULL,
  decision_at   TIMESTAMPTZ,
  reject_reason TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_so_dates CHECK (expected_date >= order_date),
  CONSTRAINT chk_so_reject_reason CHECK (
    status NOT IN ('rejected', 'returned') OR (reject_reason IS NOT NULL AND length(btrim(reject_reason)) > 0)
  )
);
CREATE INDEX idx_so_supplier ON supply_orders (supplier_id);
CREATE INDEX idx_so_status   ON supply_orders (status);

-- ---------------------------------------------------------------------
-- 7. SUPPLY ORDER ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE supply_order_items (
  id              SERIAL PRIMARY KEY,
  supply_order_id INT           NOT NULL REFERENCES supply_orders(id) ON DELETE CASCADE,
  product_id      INT           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  UNIQUE (supply_order_id, product_id)
);

-- ---------------------------------------------------------------------
-- 8. SHIPMENTS (Pengiriman PO oleh Supplier: In Transit -> Arrived -> Inspecting -> Received / Returned)
-- ---------------------------------------------------------------------
CREATE TABLE shipments (
  id                 SERIAL PRIMARY KEY,
  shipment_number    VARCHAR(30) NOT NULL UNIQUE,
  supply_order_id    INT         NOT NULL REFERENCES supply_orders(id) ON DELETE RESTRICT,
  attempt_number     INT         NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  shipment_type      VARCHAR(20) NOT NULL DEFAULT 'initial'
                       CHECK (shipment_type IN ('initial', 'reshipment')),
  status             VARCHAR(20) NOT NULL DEFAULT 'in_transit'
                       CHECK (status IN ('in_transit', 'arrived', 'inspecting', 'received', 'returned')),
  shipping_proof_url TEXT,
  arrival_proof_url  TEXT,
  notes              TEXT        NOT NULL DEFAULT '',
  shipped_at         TIMESTAMPTZ,
  arrived_at         TIMESTAMPTZ,
  created_by         INT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supply_order_id, attempt_number)
);
CREATE INDEX idx_shipments_so     ON shipments (supply_order_id);
CREATE INDEX idx_shipments_status ON shipments (status);

-- ---------------------------------------------------------------------
-- 9. INSPECTIONS (Maks 1 pemeriksaan utama per shipment attempt)
-- ---------------------------------------------------------------------
CREATE TABLE inspections (
  id               SERIAL PRIMARY KEY,
  shipment_id      INT         NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE RESTRICT,
  instructed_by    INT         REFERENCES users(id) ON DELETE SET NULL,
  instructed_at    TIMESTAMPTZ,
  inspector_id     INT         REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'submitted')),
  overall_result   VARCHAR(20) CHECK (overall_result IN ('sesuai', 'tidak_sesuai')),
  notes            TEXT,
  submitted_at     TIMESTAMPTZ,
  manager_decision VARCHAR(20) CHECK (manager_decision IN ('accepted', 'refund')),
  decision_by      INT         REFERENCES users(id) ON DELETE SET NULL,
  decision_at      TIMESTAMPTZ,
  decision_notes   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 10. INSPECTION ITEMS (Hasil per produk & kuantitas aktual)
-- ---------------------------------------------------------------------
CREATE TABLE inspection_items (
  id            SERIAL PRIMARY KEY,
  inspection_id INT           NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  product_id    INT           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  ordered_qty   NUMERIC(12,2) NOT NULL CHECK (ordered_qty > 0),
  actual_qty    NUMERIC(12,2) NOT NULL CHECK (actual_qty >= 0),
  result        VARCHAR(20)   NOT NULL CHECK (result IN ('sesuai', 'tidak_sesuai')),
  notes         TEXT          NOT NULL DEFAULT '',
  UNIQUE (inspection_id, product_id)
);

-- ---------------------------------------------------------------------
-- 11. INSPECTION PHOTOS (Wajib >= 1 foto untuk sesuai & tidak sesuai)
-- ---------------------------------------------------------------------
CREATE TABLE inspection_photos (
  id            SERIAL PRIMARY KEY,
  inspection_id INT         NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  image_url     TEXT        NOT NULL,
  caption       TEXT        NOT NULL DEFAULT '',
  uploaded_by   INT         REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 12. RETURNS (Retur fisik barang yang tidak sesuai sebelum reshipment)
-- ---------------------------------------------------------------------
CREATE TABLE returns (
  id              SERIAL PRIMARY KEY,
  shipment_id     INT         NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE RESTRICT,
  supply_order_id INT         NOT NULL REFERENCES supply_orders(id) ON DELETE RESTRICT,
  reason          TEXT        NOT NULL,
  instructions    TEXT        NOT NULL DEFAULT '',
  status          VARCHAR(20) NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested', 'in_return', 'returned')),
  initiated_by    INT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  returned_at     TIMESTAMPTZ,
  confirmed_by    INT         REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 13. INVENTORY TRANSACTIONS (IN otomatis dari inspection / OUT dari Staff)
-- ---------------------------------------------------------------------
CREATE TABLE inventory_transactions (
  id              SERIAL PRIMARY KEY,
  trx_number      VARCHAR(30)  NOT NULL UNIQUE,
  type            VARCHAR(10)  NOT NULL CHECK (type IN ('IN', 'OUT')),
  trx_date        DATE         NOT NULL DEFAULT CURRENT_DATE,
  inspection_id   INT          UNIQUE REFERENCES inspections(id) ON DELETE RESTRICT,
  supply_order_id INT          REFERENCES supply_orders(id) ON DELETE RESTRICT,
  shipment_id     INT          REFERENCES shipments(id) ON DELETE RESTRICT,
  supplier_id     INT          REFERENCES suppliers(id) ON DELETE SET NULL,
  recipient_name  VARCHAR(150),
  destination     TEXT,
  notes           TEXT         NOT NULL DEFAULT '',
  proof_image_url TEXT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'shipped')),
  reject_reason   TEXT,
  created_by      INT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by     INT          REFERENCES users(id) ON DELETE SET NULL,
  decided_at      TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  shipped_by      INT          REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_inv_trx_shape CHECK (
    (type = 'IN'  AND status <> 'shipped')
    OR
    (type = 'OUT' AND recipient_name IS NOT NULL AND inspection_id IS NULL)
  ),
  CONSTRAINT chk_inv_trx_reject CHECK (
    status <> 'rejected' OR (reject_reason IS NOT NULL AND length(btrim(reject_reason)) > 0)
  )
);
CREATE INDEX idx_inv_trx_type_status ON inventory_transactions (type, status);
CREATE INDEX idx_inv_trx_date        ON inventory_transactions (trx_date DESC);

-- ---------------------------------------------------------------------
-- 14. INVENTORY TRANSACTION ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE inventory_transaction_items (
  id             SERIAL PRIMARY KEY,
  transaction_id INT           NOT NULL REFERENCES inventory_transactions(id) ON DELETE RESTRICT,
  product_id     INT           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity       NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  UNIQUE (transaction_id, product_id)
);
CREATE INDEX idx_inv_trx_items_prod ON inventory_transaction_items (product_id);

-- ---------------------------------------------------------------------
-- 15. STOCK MOVEMENTS (Append-only ledger perubahan stok — BR-10 & BR-20)
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
  id              SERIAL PRIMARY KEY,
  product_id      INT           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  transaction_id  INT           NOT NULL REFERENCES inventory_transactions(id) ON DELETE RESTRICT,
  movement_type   VARCHAR(10)   NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  quantity_change NUMERIC(12,2) NOT NULL,
  stock_before    NUMERIC(12,2) NOT NULL CHECK (stock_before >= 0),
  stock_after     NUMERIC(12,2) NOT NULL CHECK (stock_after  >= 0),
  actor_id        INT           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes           TEXT          NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sm_product ON stock_movements (product_id, created_at DESC);
CREATE INDEX idx_sm_trx     ON stock_movements (transaction_id);

-- ---------------------------------------------------------------------
-- 16. NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  link       VARCHAR(255) NOT NULL DEFAULT '/dashboard',
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications (user_id, is_read, created_at DESC);

-- ---------------------------------------------------------------------
-- 17. ACTIVITY LOGS (Audit Trail Sistem)
-- ---------------------------------------------------------------------
CREATE TABLE activity_logs (
  id          SERIAL PRIMARY KEY,
  actor_id    INT          REFERENCES users(id) ON DELETE SET NULL,
  actor_role  VARCHAR(30)  NOT NULL,
  action      VARCHAR(60)  NOT NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   INT,
  summary     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_created ON activity_logs (created_at DESC);

COMMIT;
