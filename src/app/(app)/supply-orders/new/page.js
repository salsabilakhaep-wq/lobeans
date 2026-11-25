import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { createSupplyOrderAction } from '@/app/actions/supply.js';
import { SupplyOrderForm } from '@/components/SupplyOrderForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Buat Permintaan Pasokan' };

export default async function NewSupplyOrderPage({ searchParams }) {
  await requireUser(['manager']);
  const sp = await searchParams;
  const defaultProductId = sp.product_id ? Number(sp.product_id) : null;

  const [suppliers, products] = await Promise.all([
    many(
      `SELECT id, supplier_code, company_name, contact_name
         FROM suppliers
        WHERE is_active = TRUE AND verification_status = 'approved'
        ORDER BY company_name`,
    ),
    many(
      `SELECT p.id, p.sku, p.name, p.stock, p.unit, c.name AS category_name
         FROM products p
         JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE
        ORDER BY c.id, p.name`,
    ),
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow="Pengadaan Gudang"
        title="Buat Permintaan Pasokan"
        subtitle="Pilih supplier mitra beserta jenis dan jumlah green bean yang dibutuhkan. Permintaan akan dikirim langsung kepada Supplier untuk dikonfirmasi."
        action={
          <LinkButton href="/supply-orders" variant="secondary">
            ← Daftar Pasokan
          </LinkButton>
        }
      />

      <Card padded className="max-w-3xl">
        <SupplyOrderForm
          action={createSupplyOrderAction}
          suppliers={suppliers}
          products={products}
          today={today}
          nextWeek={nextWeek}
          defaultProductId={defaultProductId}
        />
      </Card>
    </>
  );
}
