// Pure helpers (safe on the server and in the browser).
import type { Category } from '@enjaz/core/categories';
import { fillMessage } from '@enjaz/core/messages';
import { LOCALE_META, type Locale } from './config';
import type { Dict } from './dictionaries/id';

/** Fills {name} placeholders in a dictionary text. */
export const fill = fillMessage;

/** Rupiah the way the reader expects it: Rp1.200.000 in Indonesian, Rp1,200,000 in English and Arabic. */
export function money(locale: Locale, amount: number): string {
  return `Rp${amount.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US')}`;
}

export function dateTimeFormat(locale: Locale, timeStyle: 'short' | 'medium'): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE_META[locale].dateLocale, { dateStyle: 'medium', timeStyle, timeZone: 'Asia/Jakarta' });
}

/** The words of a category in the reader's language. Field keys differ per category, so this is a loose shape. */
export type CatText = {
  label: string;
  short: string;
  priceUnit: string;
  locationLabel: string;
  locationHint: string;
  fields: Record<string, { label: string; suffix?: string; placeholder?: string; options?: Record<string, string> }>;
};

export function catText(d: Dict, category: Category): CatText {
  return d.categories[category] as CatText;
}

/** Renders a text that has a {cmd} spot: returns the two halves around it. */
export function splitAt(text: string, marker: string): [string, string] {
  const i = text.indexOf(marker);
  return i === -1 ? [text, ''] : [text.slice(0, i), text.slice(i + marker.length)];
}
