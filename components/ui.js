import Link from 'next/link';
import { Icon } from './icons.js';
import { buttonClass } from './styles.js';

/* ───────────────────────── Header & section ───────────────────────── */

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[1.3px] text-[#536851]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-lobeans-ink sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-[12.5px] font-normal leading-relaxed text-lobeans-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-3.5 mt-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[18px] font-bold tracking-tight text-lobeans-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-lobeans-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LinkButton({ href, children, variant = 'primary', size = 'md', icon }) {
  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
    </Link>
  );
}

export function FilterPills({ basePath, param = 'status', active = '', items = [] }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {items.map(([val, label, count]) => {
        const isActive = (active || '') === (val || '');
        const href = val ? `${basePath}?${param}=${encodeURIComponent(val)}` : basePath;
        return (
          <Link
            key={`${param}-${val}`}
            href={href}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors ${
              isActive
                ? 'border-lobeans-forest bg-lobeans-forest font-bold text-white shadow-xs'
                : 'border-[#e2e0d7] bg-white font-semibold text-lobeans-ink hover:border-lobeans-forest/40 hover:bg-[#faf9f5]'
            }`}
          >
            <span>{label}</span>
            {typeof count === 'number' && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#f1efe8] text-[#536851]'
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Dashboard blocks ───────────────────────── */

export function HeroDashboard({
  roleTag,
  greeting,
  subtitle,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  contextTitle,
  contextNote,
}) {
  return (
    <div className="flex flex-col justify-between gap-6 rounded-[18px] border border-[#ddd6c4] bg-[#ebe4d4] px-6 py-7 sm:px-8 md:flex-row md:items-center">
      <div className="max-w-xl">
        <p className="text-[10.5px] font-bold uppercase tracking-[1.3px] text-[#465a45]">{roleTag}</p>
        <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-lobeans-ink sm:text-[32px]">
          {greeting}
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#4b5f49]">{subtitle}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {ctaLabel && (
            <Link href={ctaHref || '#'} className={buttonClass('primary', 'md')}>
              {ctaLabel}
            </Link>
          )}
          {secondaryLabel && (
            <Link href={secondaryHref || '#'} className="text-[12.5px] font-bold text-[#1f3d2b] hover:underline">
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
      {contextTitle && (
        <div className="shrink-0 border-t border-[#d7ceba] pt-4 md:w-[230px] md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="mb-3 h-[3px] w-9 rounded-full bg-lobeans-mustard" />
          <p className="text-[17px] font-bold tracking-tight text-lobeans-ink">{contextTitle}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#4b5f49]">{contextNote}</p>
        </div>
      )}
    </div>
  );
}

export function MetricCard({ label, value, note, href }) {
  const body = (
    <div className="flex h-full flex-col justify-between gap-1.5 rounded-[14px] border border-[#e6e5de] bg-white px-5 py-5 transition-all hover:border-lobeans-forest/35 hover:shadow-xs">
      <p className="text-[11.5px] font-semibold text-lobeans-muted">{label}</p>
      <p className="text-[26px] font-bold leading-tight tracking-tight text-lobeans-ink sm:text-[28px]">{value}</p>
      {note && <p className="text-[11px] font-medium text-[#68746a]">{note}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

/* ───────────────────────── Card & table ───────────────────────── */

export function Card({ title, subtitle, action, children, padded = false, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-[14px] border border-[#e6e5de] bg-white ${className}`}>
      {(title || action) && (
        <div className="flex flex-col justify-between gap-3 border-b border-[#eeede6] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            {title && <h3 className="text-[15.5px] font-bold tracking-tight text-lobeans-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[11.5px] text-[#6b766d]">{subtitle}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={padded ? 'p-5 sm:p-6' : ''}>{children}</div>
    </section>
  );
}

/** Kelas untuk menyembunyikan kolom sekunder di layar kecil agar tabel tidak perlu scroll ke samping. */
export function hideCls(h) {
  if (h === 'sm') return 'hidden sm:table-cell';
  if (h === 'md') return 'hidden md:table-cell';
  if (h === 'lg') return 'hidden lg:table-cell';
  if (h === 'xl') return 'hidden xl:table-cell';
  return '';
}

export const td = 'px-4 py-3.5 align-middle sm:px-5';

/**
 * Tabel penuh-lebar (tanpa min-width) — kolom sekunder disembunyikan di layar kecil,
 * sehingga kartu selalu rapi dan tidak perlu di-scroll ke samping.
 */
export function DataTable({ head, children, empty, emptyText = 'Belum ada data.' }) {
  return (
    <div className="w-full">
      <table className="w-full table-auto text-left text-[12.5px]">
        <thead className="border-b border-[#eeede6] bg-[#faf9f5]">
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.8px] text-[#5f6b5f] sm:px-5 ${
                  h.align === 'right' ? 'text-right' : ''
                } ${hideCls(h.hide)}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eeede6] text-lobeans-ink">{children}</tbody>
      </table>
      {empty && <p className="px-6 py-10 text-center text-[12.5px] font-medium text-lobeans-muted">{emptyText}</p>}
    </div>
  );
}

/* ───────────────────────── Badges ───────────────────────── */

const TONES = {
  green: 'bg-[#e7f1e6] text-[#1f4d2e] border-[#cce0ca]',
  yellow: 'bg-amber-50 text-amber-900 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-sky-50 text-sky-800 border-sky-200',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  purple: 'bg-purple-50 text-purple-800 border-purple-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function Badge({ tone = 'gray', children }) {
  return (
    <span
      className={`inline-flex h-[24px] items-center whitespace-nowrap rounded-[6px] border px-2.5 text-[10.5px] font-bold ${
        TONES[tone] || TONES.gray
      }`}
    >
      {children}
    </span>
  );
}

const STOCK = {
  normal: ['green', 'Normal'],
  low: ['yellow', 'Low'],
  severe: ['red', 'Severe'],
  out_of_stock: ['gray', 'Out of Stock'],
};

export function StockBadge({ status }) {
  const [tone, label] = STOCK[status] || STOCK.normal;
  return <Badge tone={tone}>{label}</Badge>;
}

const STATUS = {
  // Restock Order (PO) & Shipment
  pending: ['yellow', 'Pending'],
  confirmed: ['indigo', 'Confirmed'],
  rejected: ['red', 'Rejected'],
  in_transit: ['blue', 'In Transit'],
  arrived: ['purple', 'Arrived'],
  inspecting: ['yellow', 'Inspecting'],
  received: ['green', 'Received'],
  returned: ['red', 'Returned'],
  // Transaction
  approved: ['green', 'Approved'],
  shipped: ['blue', 'Shipped'],
  IN: ['green', 'IN'],
  OUT: ['blue', 'OUT'],
  // Inspection & Return
  submitted: ['purple', 'Submitted'],
  sesuai: ['green', 'Sesuai'],
  tidak_sesuai: ['red', 'Tidak Sesuai'],
  Sesuai: ['green', 'Sesuai'],
  'Tidak Sesuai': ['red', 'Tidak Sesuai'],
  requested: ['red', 'Klaim Refund'],
  cancelled: ['gray', 'Dibatalkan'],
  // Master Data
  active: ['green', 'Aktif'],
  inactive: ['gray', 'Nonaktif'],
};

export function StatusBadge({ status, label }) {
  const [tone, def] = STATUS[status] || ['gray', status || '-'];
  return <Badge tone={tone}>{label || def}</Badge>;
}

/* ───────────────────────── Notices ───────────────────────── */

export function Flash({ ok, err }) {
  if (!ok && !err) return null;
  return (
    <div
      role="status"
      className={`mb-5 flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-[12.5px] font-medium ${
        ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <Icon name={ok ? 'check' : 'alert'} className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{ok || err}</span>
    </div>
  );
}
