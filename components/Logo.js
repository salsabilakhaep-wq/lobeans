/**
 * Logo LOBEANS.
 * Ganti file /public/logo-mark.svg dengan logo final Anda (rasio 1:1),
 * atau ganti seluruh isi komponen ini dengan <img src="/logo.png" />.
 */
export function Logo({ dark = false, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.svg" alt="LOBEANS" width={compact ? 32 : 40} height={compact ? 32 : 40} className="shrink-0" />
      <div className="leading-none">
        <div className="flex items-center gap-1">
          <span
            className={`font-bold tracking-[0.5px] ${compact ? 'text-[17px]' : 'text-[21px]'} ${
              dark ? 'text-lobeans-cream' : 'text-lobeans-forest'
            }`}
          >
            LOBEANS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-lobeans-mustard" />
        </div>
        {!compact && (
          <p className={`mt-1 text-[7.5px] font-medium tracking-[1px] ${dark ? 'text-lobeans-sage' : 'text-lobeans-muted'}`}>
            COFFEE INVENTORY MANAGEMENT
          </p>
        )}
      </div>
    </div>
  );
}
