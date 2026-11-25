import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { APP_CONFIG } from './appConfig.js';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads');
const MAX_BYTES = APP_CONFIG.upload.maxSizeMb * 1024 * 1024;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.length > 6 && buf.subarray(0, 4).toString() === 'GIF8') return 'image/gif';
  return null;
}

export async function saveImage(file, { required = false, fallbackUrl = null } = {}) {
  const empty = !file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || file.size === 0;
  if (empty) {
    if (fallbackUrl) return { url: fallbackUrl };
    return required ? { error: 'Foto dokumentasi wajib diunggah' } : { url: null };
  }
  if (file.size > MAX_BYTES) return { error: `Ukuran gambar maksimal ${APP_CONFIG.upload.maxSizeMb} MB` };
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  const ext = mime ? EXT[mime] : null;
  if (!ext || !APP_CONFIG.upload.allowedExtensions.includes(ext)) {
    return { error: `Format gambar harus ${APP_CONFIG.upload.allowedExtensions.join(', ').toUpperCase()}` };
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), buf);
  return { url: `/uploads/${name}` };
}

export async function removeImage(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const name = path.basename(url);
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(name)) return;
  try {
    await unlink(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
  } catch {
    /* sudah tidak ada */
  }
}
