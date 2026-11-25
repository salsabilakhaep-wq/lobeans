import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { parsePositiveInt } from '@/lib/form.js';
import { todayISO } from '@/lib/format.js';
import { updateOutgoingAction } from '@/app/actions/transactions.js';
import { OutgoingForm } from '@/components/OutgoingForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Ubah Transaksi Pending' };

export default async function EditOutgoingTransactionPage({ params }) {
  const user = await requireUser(['staff']);
  const { id } = await params;
  const numId = parsePositiveInt(id);
  if (!numId) notFound();

  const [trx, items, products] = await Promise.all([
    one('SELECT * FROM inventory_transactions WHERE id = $1', [numId]),
    many('SELECT product_id, quantity FROM inventory_transaction_items WHERE transaction_id = $1 ORDER BY id', [numId]),
    many(
      `SELECT p.id, p.sku, p.name, p.stock, p.unit, c.name AS category_name
         FROM products p JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE AND p.stock > 0
        ORDER BY c.id, p.name`,
    ),
  ]);

  if (!trx || trx.type !== 'OUT' || trx.status !== 'pending' || trx.created_by !== user.id) {
    notFound();
  }

  const action = updateOutgoingAction.bind(null, trx.id);
  const today = todayISO();

  return (
    <>
      <PageHeader
        eyebrow="Ubah Pengajuan Barang Keluar"
        title={`Edit ${trx.trx_number}`}
        subtitle="Ubah produk, kuantitas, atau catatan selama transaksi masih berstatus Pending."
        action={
          <LinkButton href={`/transactions/${trx.id}`} variant="secondary">
            ← Detail Transaksi
          </LinkButton>
        }
      />

      <Card padded className="max-w-3xl">
        <OutgoingForm action={action} products={products} today={today} initial={trx} initialItems={items} isEdit />
      </Card>
    </>
  );
}
