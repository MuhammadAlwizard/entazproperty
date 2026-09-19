import { NextResponse, type NextRequest } from 'next/server';
import { verifySignedToken } from '@enjaz/core/session';
import { baseSecurityHeaders, buildCsp, newNonce } from '@enjaz/core/csp';
import { COOKIE } from '@/lib/cookie';

// First gate only: it rejects requests with no valid cookie signature without touching the database.
// Pages, server actions and route handlers still call requireAdmin(), which checks the real session.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await verifySignedToken(req.cookies.get(COOKIE)?.value, process.env.SESSION_SECRET);

  // /login is never redirected here: a cookie can have a valid signature but a revoked session, and
  // bouncing between /login and / would loop forever. The login page checks the real session itself.
  if (pathname !== '/login' && !token) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const nonce = newNonce();
  const dev = process.env.NODE_ENV === 'development';
  const csp = buildCsp({ nonce, dev });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Cache-Control', 'no-store'); // admin pages must never sit in a shared cache
  for (const [k, v] of Object.entries(baseSecurityHeaders(!dev))) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: ['/((?!uploads|_next/static|_next/image|icon.png|logo-.*\\.png|robots.txt).*)'],
};
