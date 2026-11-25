import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { APP_CONFIG } from '@/lib/appConfig.js';
import { getCurrentUser } from '@/lib/auth.js';
import { UPLOAD_DIR } from '@/lib/upload.js';

const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export async function GET(_req, { params }) {
  if (APP_CONFIG.security.requireAuthForUploads) {
    const user = await getCurrentUser();
    if (!user) return new Response('Unauthorized', { status: 401 });
  }

  const { file } = await params;
  const m = /^[a-f0-9-]+\.(jpg|png|webp|gif)$/.exec(file);
  if (!m) return new Response('Not found', { status: 404 });
  try {
    const buf = await readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, file));
    return new Response(buf, {
      headers: {
        'Content-Type': TYPES[m[1]],
        'Cache-Control': APP_CONFIG.security.requireAuthForUploads
          ? `private, max-age=${APP_CONFIG.upload.cacheMaxAgeSeconds}`
          : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
