import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';
import { APP_CONFIG } from '@/lib/appConfig.js';

const COOKIE_NAME = APP_CONFIG.auth.cookieName;

const PUBLIC_PATHS = ['/login', '/register'];

const PRIVATE_PREFIXES = [
  '/dashboard',
  '/users',
  '/suppliers',
  '/products',
  '/categories',
  '/supply-orders',
  '/shipments',
  '/inspections',
  '/transactions',
  '/reports',
  '/notifications',
  '/account',
  '/api/export',
];

const ROLE_RULES = [
  { prefix: '/supply-orders/new', roles: ['manager'] },
  { prefix: '/transactions/new', roles: ['staff'] },
  { prefix: '/products/new', roles: ['admin', 'manager'] },
  { prefix: '/categories/new', roles: ['admin', 'manager'] },
  { prefix: '/users', roles: ['admin'] },
  { prefix: '/suppliers', roles: ['admin'] },
  { prefix: '/categories', roles: ['admin', 'manager'] },
  { prefix: '/reports', roles: ['admin', 'manager'] },
  { prefix: '/inspections', roles: ['admin', 'manager', 'staff'] },
  { prefix: '/transactions', roles: ['admin', 'manager', 'staff'] },
  { prefix: '/products', roles: ['admin', 'manager', 'staff'] },
  { prefix: '/shipments', roles: ['admin', 'manager', 'supplier'] },
  { prefix: '/account', roles: ['supplier'] },
];

function getSecretKey() {
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

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

async function verifySessionCookie(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    if (!payload?.uid || !payload?.role) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Next.js Middleware (Edge Runtime — hanya membaca cookie JWT, tanpa koneksi PostgreSQL/pg).
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionCookie(token);

  const isPublic = PUBLIC_PATHS.some((p) => matchesPrefix(pathname, p));
  const isPrivate = PRIVATE_PREFIXES.some((p) => matchesPrefix(pathname, p));

  // 1. Jika sudah login dan membuka /login atau /register -> langsung ke /dashboard
  if (isPublic && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Jika belum login (atau token tidak valid/kedaluwarsa) dan mengakses rute private
  if (isPrivate && !session) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/login', request.url));
    if (token) res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // 3. Cek pembatasan role untuk rute private
  if (session && isPrivate) {
    const rule = ROLE_RULES.find((r) => matchesPrefix(pathname, r.prefix));
    if (rule && !rule.roles.includes(session.role)) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
