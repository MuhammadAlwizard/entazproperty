import { CATEGORY_CONFIG, parseWhatsappNumbers, whatsappLink, type Category, type Listing } from '@enjaz/core';

export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const COMPANY = 'PT Enjaz Instan Properti';

export function listingHref(l: Pick<Listing, 'category' | 'slug'>): string {
  return `/${l.category}/${l.slug}`;
}

export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;
}

/** Buttons use the first number in the settings list as the primary contact. */
export function waLink(numbers: string, message: string): string | null {
  const primary = parseWhatsappNumbers(numbers)[0];
  return primary ? whatsappLink(primary, message) : null;
}

export const CATEGORY_SEO: Record<Category, { title: string; description: string; intro: string }> = {
  villa: {
    title: 'Sewa Villa',
    description: 'Daftar villa untuk disewa lengkap dengan lokasi, kapasitas, fasilitas, dan harga per malam dari PT Enjaz Instan Properti.',
    intro: 'Setiap villa mencantumkan lokasi yang bisa dicek di peta sebelum kamu memesan.',
  },
  mobil: {
    title: 'Sewa Mobil',
    description: 'Sewa mobil lepas kunci atau dengan sopir, harga per hari yang jelas, dari PT Enjaz Instan Properti.',
    intro: 'Pilih lepas kunci atau dengan sopir, sesuai rute dan durasi perjalananmu.',
  },
  motor: {
    title: 'Sewa Motor',
    description: 'Sewa motor harian untuk keliling kota dan tempat wisata, harga per hari, dari PT Enjaz Instan Properti.',
    intro: 'Motor harian untuk jalan sempit dan tempat wisata yang susah dijangkau mobil.',
  },
  tour: {
    title: 'Paket Travel dan Tour',
    description: 'Paket travel dan tour dengan itinerary jelas, transport dan pemandu sudah diatur, dari PT Enjaz Instan Properti.',
    intro: 'Itinerary sudah disusun. Transport, pemandu, dan tiket masuk sudah diatur.',
  },
};

export const CATEGORY_HEADING: Record<Category, string> = {
  villa: 'Villa',
  mobil: 'Mobil',
  motor: 'Motor',
  tour: CATEGORY_CONFIG.tour.label,
};

/** Pick a usable URL for social previews; uploads become absolute, external stay as is. */
export function previewImage(l: Pick<Listing, 'images'>): string | undefined {
  const first = l.images[0];
  return first ? absoluteUrl(first) : undefined;
}

/** Safe JSON for <script type="application/ld+json"> (prevents </script> breakout). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
