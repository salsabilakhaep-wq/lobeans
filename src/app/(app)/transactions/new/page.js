import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { createIncomingAction, createOutgoingAction } from '@/app/actions/transactions.js';
import { IncomingForm } from '@/components/IncomingForm.js';
import { OutgoingForm } from '@/components/OutgoingForm.js';
import { Card, Flash, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Buat Transaksi Baru' };

export default async function NewTransactionPage({ searchParams }) {
  await requireUser(['staff']);
  const sp = await searchParams;
  const isIncoming = String(sp?.type || '').toUpperCase() === 'IN';
  const today = new Date().toISOString().slice(0, 10);

  if (isIncoming) {
    const rawInspections = await many(
      `SELECT i.id, i.notes AS inspection_notes, i.submitted_at,
              sh.shipment_number, sh.attempt_number,
              so.order_number, s.company_name AS supplier_name,
              (SELECT image_url FROM inspection_photos WHERE inspection_id = i.id ORDER BY id ASC LIMIT 1) AS photo_url
         FROM inspections i
         JOIN shipments sh ON sh.id = i.shipment_id
         JOIN supply_orders so ON so.id = sh.supply_order_id
         JOIN suppliers s ON s.id = so.supplier_id
        WHERE i.status = 'submitted'
          AND i.overall_result = 'sesuai'
          AND (i.manager_decision IS NULL OR i.manager_decision <> 'refund')
          AND NOT EXISTS (
            SELECT 1 FROM inventory_transactions t
             WHERE t.inspection_id = i.id AND t.status <> 'rejected'
          )
        ORDER BY i.submitted_at DESC`,
    );

    const inspIds = rawInspections.map((r) => r.id);
    const inspItems = inspIds.length
      ? await many(
          `SELECT ii.inspection_id, ii.product_id, ii.actual_qty, p.sku, p.name AS product_name, p.unit
             FROM inspection_items ii
             JOIN products p ON p.id = ii.product_id
            WHERE ii.inspection_id = ANY($1::int[])
            ORDER BY ii.id`,
          [inspIds],
        )
      : [];

    const eligibleInspections = rawInspections.map((r) => ({
      ...r,
      items: inspItems.filter((it) => it.inspection_id === r.id),
    }));

    return (
      <>
        <Flash ok={sp.ok} err={sp.err} />
        <PageHeader
          eyebrow="Penerimaan Gudang"
          title="Catat Barang Masuk (IN)"
          subtitle="Ajukan catatan barang masuk dari hasil pemeriksaan fisik yang Sesuai untuk dikonfirmasi Manager Gudang."
          action={
            <LinkButton href="/transactions/in" variant="secondary">
              ← Barang Masuk (IN)
            </LinkButton>
          }
        />
        <Card padded className="max-w-3xl">
          <IncomingForm
            action={createIncomingAction}
            eligibleInspections={eligibleInspections}
            defaultInspectionId={sp.inspection_id ? Number(sp.inspection_id) : null}
            today={today}
          />
        </Card>
      </>
    );
  }

  const products = await many(
    `SELECT p.id, p.sku, p.name, p.stock, p.unit, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = TRUE AND p.stock > 0
      ORDER BY c.id, p.name`,
  );

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />
      <PageHeader
        eyebrow="Pengeluaran Gudang"
        title="Buat Barang Keluar (OUT)"
        subtitle="Ajukan pengeluaran green bean untuk pelanggan. Stok akan berkurang setelah disetujui oleh Manager Gudang."
        action={
          <LinkButton href="/transactions/out" variant="secondary">
            ← Barang Keluar (OUT)
          </LinkButton>
        }
      />
      <Card padded className="max-w-3xl">
        <OutgoingForm action={createOutgoingAction} products={products} today={today} />
      </Card>
    </>
  );
}
