import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { toCsv } from '@/lib/csv.js';

const MODULES = {
  products: {
    roles: ['admin', 'manager'],
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Nama Produk' },
      { key: 'category_name', label: 'Kategori' },
      { key: 'variety', label: 'Varietas' },
      { key: 'process_method', label: 'Proses' },
      { key: 'origin_region', label: 'Asal Wilayah' },
      { key: 'stock', label: 'Stok' },
      { key: 'unit', label: 'Satuan' },
      { key: 'min_stock', label: 'Min Stock' },
      { key: 'low_stock', label: 'Low Stock' },
      { key: 'stock_status', label: 'Status Stok' },
      { key: 'rack_location', label: 'Lokasi' },
    ],
    load: () => many('SELECT * FROM v_products ORDER BY id'),
  },
  movements: {
    roles: ['admin', 'manager'],
    columns: [
      { key: 'created_at', label: 'Waktu' },
      { key: 'trx_number', label: 'No Transaksi' },
      { key: 'sku', label: 'SKU' },
      { key: 'product_name', label: 'Produk' },
      { key: 'movement_type', label: 'Tipe' },
      { key: 'stock_before', label: 'Stok Sebelum' },
      { key: 'quantity_change', label: 'Perubahan' },
      { key: 'stock_after', label: 'Stok Sesudah' },
      { key: 'actor_name', label: 'Diproses Oleh' },
    ],
    load: () =>
      many(
        `SELECT sm.created_at, t.trx_number, p.sku, p.name AS product_name, sm.movement_type,
                sm.stock_before, sm.quantity_change, sm.stock_after, u.name AS actor_name
           FROM stock_movements sm
           JOIN products p ON p.id = sm.product_id
           JOIN inventory_transactions t ON t.id = sm.transaction_id
           JOIN users u ON u.id = sm.actor_id
          ORDER BY sm.created_at DESC`,
      ),
  },
  transactions: {
    roles: ['admin', 'manager', 'staff'],
    columns: [
      { key: 'trx_number', label: 'No Transaksi' },
      { key: 'type', label: 'Tipe' },
      { key: 'trx_date', label: 'Tanggal' },
      { key: 'counterparty', label: 'Sumber / Penerima' },
      { key: 'total_qty', label: 'Total Qty' },
      { key: 'status', label: 'Status' },
      { key: 'creator_name', label: 'Dicatat Oleh' },
      { key: 'approver_name', label: 'Disetujui Oleh' },
    ],
    load: (user) =>
      many(
        `SELECT t.trx_number, t.type, t.trx_date, t.status,
                COALESCE(t.recipient_name, s1.company_name, s2.company_name, so.order_number) AS counterparty,
                u.name AS creator_name, a.name AS approver_name,
                COALESCE((SELECT SUM(quantity) FROM inventory_transaction_items WHERE transaction_id = t.id),0)::numeric AS total_qty
           FROM inventory_transactions t
           JOIN users u ON u.id = t.created_by
           LEFT JOIN users a ON a.id = t.approved_by
           LEFT JOIN supply_orders so ON so.id = t.supply_order_id
           LEFT JOIN suppliers s1 ON s1.id = t.supplier_id
           LEFT JOIN suppliers s2 ON s2.id = so.supplier_id
          ${user.role === 'staff' ? 'WHERE t.created_by = $1' : ''}
          ORDER BY t.trx_date DESC, t.id DESC`,
        user.role === 'staff' ? [user.id] : [],
      ),
  },
  'supply-orders': {
    roles: ['admin', 'manager'],
    columns: [
      { key: 'order_number', label: 'No Pesanan' },
      { key: 'supplier_name', label: 'Supplier' },
      { key: 'order_date', label: 'Tanggal Order' },
      { key: 'expected_date', label: 'Estimasi Tiba' },
      { key: 'total_qty', label: 'Total Qty (kg)' },
      { key: 'status', label: 'Status' },
    ],
    load: () =>
      many(
        `SELECT so.order_number, s.company_name AS supplier_name, so.order_date, so.expected_date, so.status,
                COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id), 0)::numeric AS total_qty
           FROM supply_orders so
           JOIN suppliers s ON s.id = so.supplier_id
          ORDER BY so.order_date DESC, so.id DESC`,
      ),
  },
  categories: {
    roles: ['admin'],
    columns: [
      { key: 'name', label: 'Kategori' },
      { key: 'description', label: 'Deskripsi' },
      { key: 'product_count', label: 'Jumlah Produk' },
      { key: 'is_active', label: 'Aktif' },
    ],
    load: () =>
      many(
        `SELECT c.name, c.description, c.is_active, COUNT(p.id)::int AS product_count
           FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
          GROUP BY c.id ORDER BY c.id`,
      ),
  },
  suppliers: {
    roles: ['admin'],
    columns: [
      { key: 'supplier_code', label: 'Kode' },
      { key: 'company_name', label: 'Nama Perusahaan' },
      { key: 'contact_name', label: 'Penanggung Jawab' },
      { key: 'phone', label: 'Telepon' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Alamat' },
      { key: 'verification_status', label: 'Verifikasi' },
      { key: 'is_active', label: 'Aktif' },
    ],
    load: () => many('SELECT * FROM suppliers ORDER BY id'),
  },
};

export async function GET(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { module } = await params;
  if (!Object.hasOwn(MODULES, module)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const spec = MODULES[module];
  if (!spec.roles.includes(user.role)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const rows = await spec.load(user);
  const csv = toCsv(spec.columns, rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lobeans-${module}.csv"`,
    },
  });
}
