import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '@/lib/upload.js';

const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export async function GET(_req, { params }) {
  const { file } = await params;
  const m = /^[a-f0-9-]+\.(jpg|png|webp|gif)$/.exec(file);
  if (!m) return new Response('Not found', { status: 404 });
  try {
    const buf = await readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, file));
    return new Response(buf, {
      headers: {
        'Content-Type': TYPES[m[1]],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
