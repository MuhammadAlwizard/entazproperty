import type { Category } from '@enjaz/core/categories';

/** Plural forms. Indonesian uses `other` only, English `one`/`other`, Arabic all of them. */
export type Forms = { one: string; two?: string; few?: string; many?: string; other: string };

export type PluralKey = 'villa' | 'mobil' | 'motor' | 'paket' | 'kamar' | 'tamu' | 'kursi' | 'cc' | 'orang';

export type CategoryText = { name: string; title: string; description: string; intro: string; empty: string };

/**
 * Every visible sentence on the public site. English and Arabic must provide exactly the same keys,
 * so TypeScript refuses to build if a translation is missing.
 */
export type Dict = {
  meta: { title: string; description: string };
  skip: string;
  nav: { villa: string; mobil: string; motor: string; tour: string; testimoni: string; menu: string; mainMenu: string; mobileMenu: string; brand: string; whatsapp: string; language: string };
  hero: { line1: string; line2: string; text: string; cta: string; groupLabel: string; photoLabel: string };
  services: { title: string; note: string; soon: string; from: string };
  categories: Record<Category, CategoryText>;
  units: { malam: string; hari: string; orang: string };
  plural: Record<PluralKey, Forms>;
  values: Record<string, string>;
  testimonials: { title: string; region: string; stars: string };
  office: { title: string; openMaps: string; mapTitle: string };
  detail: {
    crumbs: string; home: string; specs: string; amenities: string; included: string; location: string; openMaps: string;
    mapTitle: string; photoAlt: string; morePhotos: string; noPhoto: string; aside: string; book: string; bookRest: string;
    contactSoon: string; note: string;
    autoDescription: (label: string, where: string, price: string, unit: string) => string;
    priceRange: (price: string, unit: string) => string;
  };
  footer: { services: string; contact: string; contactSoon: string; language: string };
  notFound: { title: string; text: string; back: string };
  wa: { general: string; interested: (title: string, where: string, url: string) => string };
};
