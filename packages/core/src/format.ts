import { CATEGORY_CONFIG, type Category } from './categories';
import type { Listing } from './types';

const rupiah = new Intl.NumberFormat('id-ID');

export function formatRupiah(n: number): string {
  return `Rp${rupiah.format(Math.max(0, Math.round(n)))}`;
}

export function priceLabel(category: Category): string {
  return `/ ${CATEGORY_CONFIG[category].priceUnit}`;
}

/** Spec lines for cards, built from the fields flagged `highlight` in categories.ts */
export function highlightSpecs(listing: Pick<Listing, 'category' | 'meta'>): string[] {
  const out: string[] = [];
  for (const f of CATEGORY_CONFIG[listing.category].fields) {
    const v = listing.meta[f.key];
    if (!f.highlight || !v) continue;
    out.push(f.suffix ? `${v} ${f.suffix}` : v);
  }
  return out;
}

export function splitList(value: string | undefined): string[] {
  return (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

/** Digits-only WhatsApp number, converting a leading 0 to Indonesia's 62 */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

/** The settings field holds one number per line (or comma separated). */
export function parseWhatsappNumbers(value: string): string[] {
  return value.split(/[\n,;]+/).map((s) => normalizeWhatsapp(s)).filter((n) => n.length >= 9);
}

/** Hero photo list from the settings field (one URL per line, order kept, duplicates dropped). */
export function parseHeroImages(value: string): string[] {
  return [...new Set(value.split(/\n+/).map((s) => s.trim()).filter(Boolean))];
}

/** 6281234567890 -> +62 812 3456 7890 */
export function displayWhatsapp(normalized: string): string {
  if (!normalized.startsWith('62')) return `+${normalized}`;
  const rest = normalized.slice(2);
  return `+62 ${rest.slice(0, 3)} ${rest.slice(3, 7)} ${rest.slice(7)}`.trim();
}

export function whatsappLink(number: string, message: string): string {
  const n = normalizeWhatsapp(number);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'listing';
}
