import { NextResponse, type NextRequest } from 'next/server';
import { baseSecurityHeaders, buildCsp, newNonce } from '@enjaz/core/csp';

// Adds a per-request nonce CSP and the standard security headers to every page response.
export function proxy(req: NextRequest) {
  const nonce = newNonce();
  const dev = process.env.NODE_ENV === 'development';
  // The villa page embeds a Google Map, so only Google may be framed.
  const csp = buildCsp({ nonce, dev, frameSrc: ['https://www.google.com', 'https://maps.google.com'] });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  for (const [k, v] of Object.entries(baseSecurityHeaders(!dev))) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: [
    {
      source: '/((?!uploads|_next/static|_next/image|icon.png|logo-.*\\.png|og.png|robots.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
