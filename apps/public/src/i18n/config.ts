// Safe to import from anywhere: server, client components, and proxy.ts (no node or database imports).

export const LOCALES = ['id', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';

export const isLocale = (v: string | undefined): v is Locale => !!v && (LOCALES as readonly string[]).includes(v);

export const LOCALE_META: Record<Locale, { name: string; short: string; htmlLang: string; dir: 'ltr' | 'rtl'; og: string; numberLocale: string }> = {
  id: { name: 'Indonesia', short: 'ID', htmlLang: 'id', dir: 'ltr', og: 'id_ID', numberLocale: 'id-ID' },
  en: { name: 'English', short: 'EN', htmlLang: 'en-US', dir: 'ltr', og: 'en_US', numberLocale: 'en-US' },
  // Arabic pages use Latin digits (0-9) and comma grouping: the most widely understood form for prices and phone numbers online.
  ar: { name: 'العربية', short: 'AR', htmlLang: 'ar', dir: 'rtl', og: 'ar_AR', numberLocale: 'en-US' },
};

/** Indonesian (default) lives at the root with no prefix, so existing URLs never change. */
export function localePath(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return p;
  return p === '/' ? `/${locale}` : `/${locale}${p}`;
}

/** Splits a browser pathname such as /en/villa/x into { locale: 'en', path: '/villa/x' }. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split('/');
  if (first === 'en' || first === 'ar') return { locale: first, path: `/${rest.join('/')}`.replace(/\/$/, '') || '/' };
  return { locale: DEFAULT_LOCALE, path: pathname || '/' };
}
