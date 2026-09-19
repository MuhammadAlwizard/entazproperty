import { CATEGORY_CONFIG, type Category, type Listing } from '@enjaz/core';
import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';
import { id } from './dictionaries/id';
import { LOCALE_META, type Locale } from './config';
import type { Dict, Forms, PluralKey } from './types';

export * from './config';
export type { Dict } from './types';

const DICTS: Record<Locale, Dict> = { id, en, ar };
export const getDict = (locale: Locale): Dict => DICTS[locale];

export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

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

const COUNT_KEY: Record<Category, PluralKey> = { villa: 'villa', mobil: 'mobil', motor: 'motor', tour: 'paket' };
export const countLabel = (locale: Locale, category: Category, n: number) => pluralize(locale, n, getDict(locale).plural[COUNT_KEY[category]]);

/** Rp1.200.000 in Indonesian, Rp1,200,000 in English and Arabic. Always the rupiah, no conversion. */
export const formatPrice = (locale: Locale, n: number) =>
  `Rp${new Intl.NumberFormat(LOCALE_META[locale].numberLocale).format(Math.max(0, Math.round(n)))}`;

export const unitLabel = (locale: Locale, category: Category) => getDict(locale).units[CATEGORY_CONFIG[category].priceUnit as keyof Dict['units']];

const SPEC_PLURAL: Record<string, PluralKey> = { kamar: 'kamar', tamu: 'tamu', kursi: 'kursi', cc: 'cc', minPeserta: 'orang' };

/** Card / chip lines built from the category's highlighted fields, in the visitor's language. */
export function specLines(listing: Pick<Listing, 'category' | 'meta'>, locale: Locale): string[] {
  const d = getDict(locale);
  const out: string[] = [];
  for (const f of CATEGORY_CONFIG[listing.category].fields) {
    const v = listing.meta[f.key];
    if (!f.highlight || !v) continue;
    if (f.type === 'select') out.push(d.values[v] ?? v);
    else if (f.type === 'number' && SPEC_PLURAL[f.key]) {
      out.push(f.key === 'cc' ? `${v} cc` : pluralize(locale, Number(v), d.plural[SPEC_PLURAL[f.key]]));
    } else out.push(f.suffix && f.type === 'number' ? `${v} ${f.suffix}` : v);
  }
  return out;
}
