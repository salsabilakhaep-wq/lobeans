import { APP_CONFIG } from '@/lib/appConfig.js';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { parsePositiveInt } from '@/lib/form.js';
import { addDaysISO, num, todayISO } from '@/lib/format.js';
import { createSupplyOrderAction } from '@/app/actions/supply.js';
import { SupplyOrderForm } from '@/components/SupplyOrderForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Buat Permintaan Pasokan' };

export default async function NewSupplyOrderPage({ searchParams }) {
  await requireUser(['manager']);
  const sp = await searchParams;
  const defaultProductId = parsePositiveInt(sp.product_id);

  const [suppliers, products] = await Promise.all([
    many(
      `SELECT id, supplier_code, company_name, contact_name
         FROM suppliers
        WHERE is_active = TRUE AND verification_status = 'approved'
        ORDER BY company_name`,
    ),
    many(
      `SELECT p.id, p.sku, p.name, p.stock, p.low_stock, p.unit, c.name AS category_name
         FROM products p
         JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE
        ORDER BY c.id, p.name`,
    ),
  ]);

  const selectedProduct = defaultProductId ? products.find((p) => p.id === defaultProductId) : null;

  const today = todayISO();
  const nextWeek = addDaysISO(today, APP_CONFIG.supplyOrder.defaultExpectedDays);

  return (
    <>
      <PageHeader
        eyebrow="Pengadaan Gudang"
        title="Buat Permintaan Pasokan (PO)"
        subtitle="Pilih supplier mitra beserta jenis dan jumlah green bean yang dibutuhkan. Permintaan akan dikirim langsung kepada Supplier untuk dikonfirmasi."
        action={
          <LinkButton href="/supply-orders" variant="secondary">
            ← Daftar Pasokan
          </LinkButton>
        }
      />

      {selectedProduct && (
        <div className="mb-5 max-w-3xl rounded-[12px] border border-amber-300/80 bg-amber-50/80 px-4 py-3 text-[12.5px] text-amber-950">
          <strong className="font-bold">Restock cepat dari Kelola Produk:</strong> {selectedProduct.name} (
          <span className="font-mono">{selectedProduct.sku}</span>) — stok saat ini{' '}
          <strong className="tabular-nums">
            {num(selectedProduct.stock)} {selectedProduct.unit}
          </strong>{' '}
          (ambang low {num(selectedProduct.low_stock)} {selectedProduct.unit}).
        </div>
      )}

      <Card padded className="max-w-3xl">
        <SupplyOrderForm
          action={createSupplyOrderAction}
          suppliers={suppliers}
          products={products}
          today={today}
          nextWeek={nextWeek}
          defaultProductId={selectedProduct?.id ?? null}
          defaultQty={APP_CONFIG.supplyOrder.defaultRestockQty}
        />
      </Card>
    </>
  );
}
