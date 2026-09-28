import { CATEGORY_CONFIG, type Category, type Listing } from '@enjaz/core';
import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';
import { id } from './dictionaries/id';
import type { Locale } from './config';
import { pluralize } from './plural';
import type { Dict, PluralKey } from './types';

export * from './config';
export { pluralize, formatPrice, formatDay } from './plural';
export type { Dict } from './types';

const DICTS: Record<Locale, Dict> = { id, en, ar };
export const getDict = (locale: Locale): Dict => DICTS[locale];

export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

const COUNT_KEY: Record<Category, PluralKey> = { villa: 'villa', mobil: 'mobil', motor: 'motor', tour: 'paket' };
export const countLabel = (locale: Locale, category: Category, n: number) => pluralize(locale, n, getDict(locale).plural[COUNT_KEY[category]]);

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
