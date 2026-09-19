import { parseWhatsappNumbers, whatsappLink, type Listing } from '@enjaz/core';
import { LOCALES, LOCALE_META, localePath, type Locale } from '@/i18n/config';

export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const COMPANY = 'PT Enjaz Instan Properti';

export function listingHref(locale: Locale, l: Pick<Listing, 'category' | 'slug'>): string {
  return localePath(locale, `/${l.category}/${l.slug}`);
}

export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;
}

/** Buttons use the first number in the settings list as the primary contact. */
export function waLink(numbers: string, message: string): string | null {
  const primary = parseWhatsappNumbers(numbers)[0];
  return primary ? whatsappLink(primary, message) : null;
}

/** canonical + hreflang links for a page, so search engines show each visitor the right language. */
export function alternatesFor(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [LOCALE_META[l].htmlLang, localePath(l, path)])),
      'x-default': localePath('id', path),
    },
  };
}

/** Pick a usable URL for social previews; uploads become absolute, external stay as is. */
export function previewImage(l: Pick<Listing, 'images'>): string | undefined {
  const first = l.images[0];
  return first ? absoluteUrl(first) : undefined;
}

/** Safe JSON for <script type="application/ld+json"> (prevents </script> breakout). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
