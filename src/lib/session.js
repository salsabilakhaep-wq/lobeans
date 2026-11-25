import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { APP_CONFIG } from './appConfig.js';

const COOKIE = APP_CONFIG.auth.cookieName;
const MAX_AGE = 60 * 60 * APP_CONFIG.auth.sessionHours;

function secretKey() {
  const envSecret = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!envSecret || envSecret.length < APP_CONFIG.auth.minSecretLength) {
      throw new Error(`AUTH_SECRET wajib diisi minimal ${APP_CONFIG.auth.minSecretLength} karakter pada mode production.`);
    }
    return new TextEncoder().encode(envSecret);
  }
  const secret = envSecret || APP_CONFIG.auth.devFallbackSecret;
  return new TextEncoder().encode(secret);
}

export async function createSession(user) {
  const token = await new SignJWT({
    uid: user.id,
    role: user.role,
    supplier_id: user.supplier_id || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function readSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
