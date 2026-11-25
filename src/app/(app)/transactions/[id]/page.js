import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { parsePositiveInt } from '@/lib/form.js';
import { fmtDate, fmtDateTime, num } from '@/lib/format.js';
import { TransactionDecisionPanel } from '@/components/TransactionDecisionPanel.js';
import { Card, DataTable, Flash, LinkButton, PageHeader, StatusBadge, td } from '@/components/ui.js';

export const metadata = { title: 'Detail Transaksi' };

export default async function TransactionDetailPage({ params, searchParams }) {
  const user = await requireUser(['admin', 'manager', 'staff']);
  const { id } = await params;
  const sp = await searchParams;
  const numId = parsePositiveInt(id);
  if (!numId) notFound();

  const trx = await one(
    `SELECT t.*, u.name AS creator_name, a.name AS approver_name, sh_u.name AS shipper_name,
            so.order_number, sh.shipment_number,
            COALESCE(s1.company_name, s2.company_name) AS supplier_name
       FROM inventory_transactions t
       JOIN users u ON u.id = t.created_by
       LEFT JOIN users a ON a.id = t.approved_by
       LEFT JOIN users sh_u ON sh_u.id = t.shipped_by
       LEFT JOIN supply_orders so ON so.id = t.supply_order_id
       LEFT JOIN shipments sh ON sh.id = t.shipment_id
       LEFT JOIN suppliers s1 ON s1.id = t.supplier_id
       LEFT JOIN suppliers s2 ON s2.id = so.supplier_id
      WHERE t.id = $1`,
    [numId],
  );
  if (!trx) notFound();

  const [items, movements] = await Promise.all([
    many(
      `SELECT ti.*, p.sku, p.name AS product_name, p.stock AS live_stock, p.unit
         FROM inventory_transaction_items ti
         JOIN products p ON p.id = ti.product_id
        WHERE ti.transaction_id = $1 ORDER BY ti.id`,
      [numId],
    ),
    many(
      `SELECT sm.*, p.sku, p.name AS product_name, u.name AS actor_name
         FROM stock_movements sm
         JOIN products p ON p.id = sm.product_id
         JOIN users u ON u.id = sm.actor_id
        WHERE sm.transaction_id = $1 ORDER BY sm.id`,
      [numId],
    ),
  ]);

  const totalKg = items.reduce((a, it) => a + Number(it.quantity), 0);
  const backHref = trx.type === 'IN' ? '/transactions/in' : '/transactions/out';
  const backLabel = trx.type === 'IN' ? '← Barang Masuk (IN)' : '← Barang Keluar (OUT)';

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow={trx.type === 'IN' ? 'Transaksi Barang Masuk (IN)' : 'Transaksi Barang Keluar (OUT)'}
        title={trx.trx_number}
        subtitle={
          trx.type === 'IN'
            ? `Supplier: ${trx.supplier_name || 'Penerimaan Gudang'}${trx.order_number ? ` (${trx.order_number})` : ''} · Tanggal ${fmtDate(trx.trx_date)}`
            : `Penerima: ${trx.recipient_name} · ${trx.destination || ''} · Tanggal ${fmtDate(trx.trx_date)}`
        }
        action={
          <LinkButton href={backHref} variant="secondary">
            {backLabel}
          </LinkButton>
        }
      />

      <div className="space-y-6">
        <Card
          title="Status"
          subtitle="Konfirmasi transaksi dan pantau tahapan pembaruan stok."
          action={<StatusBadge status={trx.status} />}
          padded
          className="border-lobeans-mustard/50"
        >
          <TransactionDecisionPanel trx={trx} user={user} />
        </Card>

        <Card title="Informasi Transaksi" padded>
          <dl className="grid grid-cols-1 gap-5 text-[12.5px] sm:grid-cols-3">
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Dicatat Oleh</dt>
              <dd className="mt-1 font-bold text-lobeans-ink">{trx.creator_name}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Persetujuan Manager</dt>
              <dd className="mt-1 font-bold text-lobeans-ink">
                {trx.approver_name ? `${trx.approver_name} · ${fmtDateTime(trx.decided_at)}` : 'Menunggu persetujuan'}
              </dd>
            </div>
            {trx.type === 'IN' && trx.supply_order_id && (
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Referensi Pasokan</dt>
                <dd className="mt-1 font-mono font-bold">
                  <Link href={`/supply-orders/${trx.supply_order_id}`} className="text-[#284c35] hover:underline">
                    {trx.order_number} {trx.shipment_number ? `/ ${trx.shipment_number}` : ''} →
                  </Link>
                </dd>
              </div>
            )}
            {trx.shipped_at && (
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Waktu Pengiriman</dt>
                <dd className="mt-1 font-bold text-lobeans-ink">
                  {fmtDateTime(trx.shipped_at)} ({trx.shipper_name})
                </dd>
              </div>
            )}
            <div className="sm:col-span-3">
              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Catatan</dt>
              <dd className="mt-1 text-lobeans-ink">{trx.notes || '—'}</dd>
            </div>
            {trx.proof_image_url && (
              <div className="sm:col-span-3">
                <dt className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Bukti Pendukung</dt>
                <dd>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={trx.proof_image_url} alt="Bukti transaksi" className="max-h-[220px] rounded-[10px] border border-[#e5e4dc] object-cover" />
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title={`Item Produk (${num(totalKg)} kg)`}>
          <DataTable
            head={[
              { label: 'Produk & SKU' },
              { label: 'Stok Saat Ini', align: 'right' },
              { label: 'Kuantitas Transaksi', align: 'right' },
            ]}
          >
            {items.map((it) => (
              <tr key={it.id}>
                <td className={td}>
                  <Link href={`/products/${it.product_id}`} className="font-bold text-lobeans-ink hover:text-lobeans-forest hover:underline">
                    {it.product_name}
                  </Link>
                  <p className="font-mono text-[11px] text-lobeans-muted">{it.sku}</p>
                </td>
                <td className={`${td} text-right tabular-nums text-lobeans-muted`}>
                  {num(it.live_stock)} {it.unit}
                </td>
                <td className={`${td} text-right font-bold tabular-nums ${trx.type === 'IN' ? 'text-emerald-700' : 'text-amber-900'}`}>
                  {trx.type === 'IN' ? '+' : '-'}
                  {num(it.quantity)} {it.unit}
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {movements.length > 0 && (
          <Card title="Riwayat Perubahan Stok" subtitle="Catatan otomatis perubahan saldo stok pada transaksi ini.">
            <DataTable
              head={[
                { label: 'Produk' },
                { label: 'Stok Sebelum', align: 'right' },
                { label: 'Perubahan', align: 'right' },
                { label: 'Stok Sesudah', align: 'right' },
                { label: 'Diproses Oleh' },
              ]}
            >
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className={`${td} font-bold text-lobeans-ink`}>{m.product_name}</td>
                  <td className={`${td} text-right tabular-nums text-lobeans-muted`}>{num(m.stock_before)} kg</td>
                  <td className={`${td} text-right font-bold tabular-nums ${m.movement_type === 'IN' ? 'text-emerald-700' : 'text-amber-900'}`}>
                    {Number(m.quantity_change) > 0 ? `+${num(m.quantity_change)}` : num(m.quantity_change)} kg
                  </td>
                  <td className={`${td} text-right font-bold tabular-nums`}>{num(m.stock_after)} kg</td>
                  <td className={`${td} text-[11.5px] text-lobeans-muted`}>
                    {m.actor_name} · {fmtDateTime(m.created_at)}
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}
