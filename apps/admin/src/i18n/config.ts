// Languages of the admin panel. No imports from next/headers or from the dictionaries, so the proxy can use it.
//
// Unlike the public site, the admin language is NOT in the URL: the panel is private (no search engines, no sharing),
// and a /en prefix would complicate the login rules. The choice is kept in a cookie instead.

export const LOCALES = ['id', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';

export const LANG_COOKIE = 'enjaz_admin_lang';

export const LOCALE_META: Record<Locale, { name: string; dir: 'ltr' | 'rtl'; htmlLang: string; dateLocale: string }> = {
  id: { name: 'Indonesia', dir: 'ltr', htmlLang: 'id', dateLocale: 'id-ID' },
  en: { name: 'English', dir: 'ltr', htmlLang: 'en', dateLocale: 'en-US' },
  // Latin digits (0-9) like the public site: they are what people expect in prices, phone numbers and dates.
  ar: { name: 'العربية', dir: 'rtl', htmlLang: 'ar', dateLocale: 'ar-u-nu-latn' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** The one message the proxy itself sends (API calls without a session). Everything else comes from the dictionaries. */
export const NEED_LOGIN: Record<Locale, string> = {
  id: 'Silakan masuk dulu.',
  en: 'Please sign in first.',
  ar: 'يرجى تسجيل الدخول أولاً.',
};
