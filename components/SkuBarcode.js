'use client';

/**
 * Generator visual barcode deterministik berbasis kode SKU (SVG ringan tanpa dependensi eksternal)
 * + tombol cetak label rak gudang.
 */
function encodeBars(sku) {
  const text = String(sku || 'LOBEANS').toUpperCase();
  const bars = [1, 0, 1, 1, 0]; // start guard
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    for (let b = 6; b >= 0; b--) {
      bars.push((code >> b) & 1);
    }
    bars.push(0); // separator
  }
  bars.push(1, 1, 0, 1); // end guard
  return bars;
}

export function SkuBarcode({ sku, name, rackLocation }) {
  const bars = encodeBars(sku);
  const unitW = 2;
  const width = bars.length * unitW + 20;

  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="rounded-[12px] border border-[#e6e5de] bg-[#faf9f5] px-5 py-4 text-center">
        <svg
          viewBox={`0 0 ${width} 56`}
          className="mx-auto h-[54px] w-auto max-w-full"
          role="img"
          aria-label={`Barcode SKU ${sku}`}
        >
          {bars.map((bit, idx) =>
            bit ? <rect key={idx} x={10 + idx * unitW} y={4} width={unitW} height={48} fill="#13291f" /> : null,
          )}
        </svg>
        <p className="mt-2 font-mono text-[13px] font-bold tracking-[2px] text-lobeans-ink">{sku}</p>
        <p className="text-[10.5px] text-lobeans-muted">
          {name} · {rackLocation}
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-[38px] items-center justify-center rounded-[10px] border border-lobeans-border bg-white px-4 text-[12px] font-bold text-lobeans-ink transition-colors hover:bg-[#f4f3ee]"
      >
        Cetak Label SKU
      </button>
    </div>
  );
}
