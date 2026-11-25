import pg from 'pg';

const { Pool, types } = pg;

// DATE tetap string 'YYYY-MM-DD' (hindari pergeseran zona waktu); angka dikonversi ke Number.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(20, (v) => parseInt(v, 10));
types.setTypeParser(1700, (v) => parseFloat(v));

const TZ = process.env.APP_TZ || 'Asia/Makassar';
const CONN = process.env.DATABASE_URL;
if (!CONN) {
  throw new Error('DATABASE_URL belum diatur. Salin .env.example menjadi .env.local dan isi kredensial PostgreSQL Anda.');
}

const g = globalThis;
if (!g.__lobeansPool || g.__lobeansPoolUrl !== CONN) {
  g.__lobeansPool = new Pool({
    connectionString: CONN,
    max: 10,
    options: `-c TimeZone=${TZ}`,
  });
  g.__lobeansPoolUrl = CONN;
}
export const pool = g.__lobeansPool;

/** Jalankan query dan kembalikan seluruh baris. */
export async function many(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

/** Jalankan query dan kembalikan baris pertama (atau null). */
export async function one(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows[0] ?? null;
}

/** Jalankan query tanpa peduli hasil (mengembalikan objek hasil pg). */
export function query(text, params = []) {
  return pool.query(text, params);
}

/** Jalankan beberapa query dalam satu transaksi database (BEGIN/COMMIT/ROLLBACK). */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* abaikan */
    }
    throw err;
  } finally {
    client.release();
  }
}
