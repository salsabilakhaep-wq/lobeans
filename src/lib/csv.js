import { APP_CONFIG } from './appConfig.js';

/**
 * Ubah baris data menjadi CSV (UTF-8 BOM agar terbaca rapi di Excel).
 * Dilengkapi proteksi CSV Formula Injection (menetralisir awalan =, +, -, @, tab, CR).
 */
export function toCsv(columns, rows) {
  const esc = (v) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (APP_CONFIG.security.protectCsvFormulaInjection && /^[=+\-@\t\r]/.test(s)) {
      s = `'${s}`;
    }
    return /[",;\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(',')];
  for (const r of rows) lines.push(columns.map((c) => esc(r[c.key])).join(','));
  return '\uFEFF' + lines.join('\r\n');
}
