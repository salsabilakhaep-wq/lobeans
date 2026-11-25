import { StatusBadge } from './ui.js';

export function ShipmentProofCards({ shipments = [] }) {
  const items = [];
  for (const sh of shipments) {
    if (sh.shipping_proof_url) {
      items.push({
        key: `ship-${sh.id}`,
        title: `Bukti Kirim · ${sh.shipment_number}`,
        subtitle: sh.shipped_at_fmt ? `Dikirim ${sh.shipped_at_fmt}` : 'Bukti pengiriman',
        badge: 'In Transit',
        url: sh.shipping_proof_url,
      });
    }
    if (sh.arrival_proof_url) {
      items.push({
        key: `arr-${sh.id}`,
        title: `Bukti Barang Tiba · ${sh.shipment_number}`,
        subtitle: sh.arrived_at_fmt ? `Tiba ${sh.arrived_at_fmt}` : 'Bukti kedatangan',
        badge: 'Arrived',
        url: sh.arrival_proof_url,
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="border-t border-[#eeede6] px-5 py-4 sm:px-6">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">
        Foto Bukti Kirim &amp; Bukti Barang Tiba ({items.length})
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-[12px] border border-[#e6e5de] bg-[#faf9f5] transition-colors hover:border-lobeans-forest"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.title}
              className="h-44 w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-lobeans-ink">{item.title}</p>
                <p className="truncate text-[10.5px] text-lobeans-muted">{item.subtitle}</p>
              </div>
              <StatusBadge status={item.badge === 'Arrived' ? 'arrived' : 'in_transit'} label={item.badge} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
