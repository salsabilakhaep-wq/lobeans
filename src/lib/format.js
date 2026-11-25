const TZ = 'Asia/Makassar';

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(n) || 0,
  );

export const num = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

// Format berat dalam kg.
export const kg = (n) => `${num(n)} kg`;

// Format tanggal. Menerima string 'YYYY-MM-DD' atau Date
export function fmtDate(d) {
  if (!d) return '-';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('id-ID', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(d).toLocaleDateString('id-ID', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('id-ID', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Tanggal hari ini (zona waktu aplikasi) dalam format YYYY-MM-DD
export function todayISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

// Tambah N hari dari string tanggal 'YYYY-MM-DD' tanpa pergeseran zona waktu
export function addDaysISO(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
