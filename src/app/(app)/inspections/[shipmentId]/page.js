import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { parsePositiveInt } from '@/lib/form.js';
import { InspectionForm } from '@/components/InspectionForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Form Pemeriksaan Fisik' };

export default async function InspectionDetailPage({ params }) {
  await requireUser(['staff']);
  const { shipmentId } = await params;
  const numId = parsePositiveInt(shipmentId);
  if (!numId) notFound();

  const shipment = await one(
    `SELECT sh.*, so.order_number, s.company_name AS supplier_name, i.status AS insp_status, i.notes AS instruction_notes
       FROM shipments sh
       JOIN supply_orders so ON so.id = sh.supply_order_id
       JOIN suppliers s ON s.id = so.supplier_id
       JOIN inspections i ON i.shipment_id = sh.id
      WHERE sh.id = $1`,
    [numId],
  );
  if (!shipment || shipment.status !== 'inspecting' || shipment.insp_status !== 'pending') {
    notFound();
  }

  const orderItems = await many(
    `SELECT soi.product_id, soi.quantity, p.sku, p.name AS product_name
       FROM supply_order_items soi
       JOIN products p ON p.id = soi.product_id
      WHERE soi.supply_order_id = $1 ORDER BY soi.id`,
    [shipment.supply_order_id],
  );

  return (
    <>
      <PageHeader
        eyebrow="Pemeriksaan Fisik Staff Gudang"
        title={`Periksa ${shipment.shipment_number}`}
        subtitle={`${shipment.order_number} · ${shipment.supplier_name} · Percobaan #${shipment.attempt_number}`}
        action={
          <LinkButton href="/inspections" variant="secondary">
            ← Kembali
          </LinkButton>
        }
      />

      {shipment.instruction_notes && (
        <div className="mb-6 rounded-[12px] border border-amber-200 bg-amber-50/70 px-4 py-3 text-[12.5px] text-amber-950">
          <strong className="font-bold">Instruksi Manager:</strong> {shipment.instruction_notes}
        </div>
      )}

      <Card padded>
        <InspectionForm shipment={shipment} orderItems={orderItems} />
      </Card>
    </>
  );
}
