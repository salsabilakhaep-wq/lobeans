import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Muat variabel dari .env.local jika DATABASE_URL belum tersedia di environment
if (!process.env.DATABASE_URL && existsSync(envLocalPath)) {
  const raw = await readFile(envLocalPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Error: DATABASE_URL belum diatur. Salin .env.example menjadi .env.local terlebih dahulu.');
  process.exit(1);
}

const parsedUrl = new URL(dbUrl);
const dbName = parsedUrl.pathname.replace(/^\//, '');
if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
  console.error(`Error: Nama database tidak valid: "${dbName}"`);
  process.exit(1);
}

const adminUrl = new URL(dbUrl);
adminUrl.pathname = '/postgres';

// 1. Pastikan database tujuan sudah ada
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
if (exists.rowCount === 0) {
  await admin.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Database ${dbName} berhasil dibuat.`);
}
await admin.end();

// 2. Jalankan schema.sql lalu seed.sql
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
const schemaSql = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');
const seedSql = await readFile(path.join(__dirname, 'seed.sql'), 'utf8');
await client.query(schemaSql);
console.log('1/2 schema.sql berhasil dijalankan.');
await client.query(seedSql);
console.log('2/2 seed.sql berhasil dijalankan.');
await client.end();
