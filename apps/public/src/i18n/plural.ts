// Formatting helpers with no dictionary or database imports, so client components can use them too.
import { LOCALE_META, type Locale } from './config';
import type { Forms } from './types';

/** "3 bedrooms", "1 bedroom". Arabic has its own rules: 1 and 2 use special words without a number. */
export function pluralize(locale: Locale, n: number, forms: Forms): string {
  if (locale === 'ar') {
    if (n === 1) return forms.one;
    if (n === 2 && forms.two) return forms.two;
    const form = n >= 11 ? (forms.many ?? forms.other) : n >= 3 && n <= 10 ? (forms.few ?? forms.other) : forms.other;
    return `${n} ${form}`;
  }
  return `${n} ${locale === 'en' && n === 1 ? forms.one : forms.other}`;
}

/** Rp1.200.000 in Indonesian, Rp1,200,000 in English and Arabic. Always the rupiah, no conversion. */
export const formatPrice = (locale: Locale, n: number) =>
  `Rp${new Intl.NumberFormat(LOCALE_META[locale].numberLocale).format(Math.max(0, Math.round(n)))}`;

/** 2026-10-03 -> "3 Oktober 2026" / "October 3, 2026" / Arabic month name with Latin digits. */
export function formatDay(locale: Locale, iso: string): string {
  const tag = locale === 'ar' ? 'ar-u-nu-latn' : LOCALE_META[locale].htmlLang;
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
