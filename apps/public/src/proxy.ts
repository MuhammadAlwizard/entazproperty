import { NextResponse, type NextRequest } from 'next/server';
import { baseSecurityHeaders, buildCsp, newNonce, cspForMeta } from '@enjaz/core/csp';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

/**
 * Language routing + security headers for every page.
 *
 *   /            -> Indonesian (internally rewritten to /id, the URL does not change)
 *   /villa/x     -> Indonesian
 *   /en/villa/x  -> English
 *   /ar/villa/x  -> Arabic
 *   /id/villa/x  -> redirected to /villa/x (one address per page, so search engines see no duplicates)
 *
 * The page code always receives a language segment ([lang]), and `x-locale` tells the not-found page
 * which language the visitor was using.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split('/')[1];

  if (first === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/';
    return NextResponse.redirect(url, 308);
  }

  const locale: Locale = first === 'en' || first === 'ar' ? first : DEFAULT_LOCALE;
  const barePath = locale === DEFAULT_LOCALE ? pathname : pathname.slice(locale.length + 1) || '/';

  const nonce = newNonce();
  const dev = process.env.NODE_ENV === 'development';
  // The villa page embeds a Google Map, so only Google may be framed.
  const csp = buildCsp({ nonce, dev, frameSrc: ['https://www.google.com', 'https://maps.google.com'] });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-csp-meta', cspForMeta(csp) ?? ''); // the same policy for the <meta> tag in the layout
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-pathname', barePath);
  requestHeaders.set('Content-Security-Policy', csp);

  let res: NextResponse;
  if (locale === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }
  res.headers.set('Content-Security-Policy', csp);
  for (const [k, v] of Object.entries(baseSecurityHeaders(!dev))) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: [
    {
      // Pages only: uploads, static assets, robots and the sitemap are served as they are.
      source: '/((?!uploads|_next/static|_next/image|icon.png|logo-.*\\.png|og.png|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
