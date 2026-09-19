import { CATEGORY_CONFIG, MAX_LISTING_IMAGES, TRANSLATION_LANGS, isCategory, translatableMetaFields, type Category } from './categories';
import type { ListingInput, ListingTranslations, TestimonialInput, TestimonialTranslations } from './types';

// Business rules for content live here so the admin form and any future
// import/API path enforce exactly the same thing. See CLAUDE.md.

export type Errors = Record<string, string>;
export type Result<T> = { ok: true; data: T } | { ok: false; errors: Errors };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function parsePrice(v: unknown): number {
  const digits = str(v).replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : NaN;
}

export function isSafeImage(url: string): boolean {
  return /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url) || /^https:\/\/[^\s]+$/.test(url);
}

/**
 * Reads the optional English / Arabic fields (tr_<lang>_title, tr_<lang>_meta_<key>, ...).
 * Blank fields are dropped, so a missing translation falls back to the Indonesian text on the site.
 */
function parseListingTranslations(raw: Record<string, unknown>, category: Category, errors: Errors): ListingTranslations {
  const out: ListingTranslations = {};
  const limits: [string, number][] = [['title', 160], ['summary', 200], ['description', 5000], ['location', 120]];
  for (const lang of TRANSLATION_LANGS) {
    const t: NonNullable<ListingTranslations[typeof lang]> = {};
    for (const [field, max] of limits) {
      const key = `tr_${lang}_${field}`;
      const v = str(raw[key]);
      if (!v) continue;
      if (v.length > max) errors[key] = `Maksimal ${max} karakter.`;
      else (t as Record<string, string>)[field] = v;
    }
    const meta: Record<string, string> = {};
    for (const f of translatableMetaFields(category)) {
      const key = `tr_${lang}_meta_${f.key}`;
      const v = str(raw[key]);
      if (!v) continue;
      if (v.length > 200) errors[key] = 'Maksimal 200 karakter.';
      else meta[f.key] = v;
    }
    if (Object.keys(meta).length) t.meta = meta;
    if (Object.keys(t).length) out[lang] = t;
  }
  return out;
}

export function validateListing(raw: Record<string, unknown>): Result<ListingInput> {
  const errors: Errors = {};

  const category = str(raw.category);
  if (!isCategory(category)) return { ok: false, errors: { category: 'Pilih kategori.' } };
  const cfg = CATEGORY_CONFIG[category];

  const title = str(raw.title);
  if (title.length < 3) errors.title = 'Nama listing minimal 3 karakter.';
  if (title.length > 120) errors.title = 'Nama listing maksimal 120 karakter.';

  const price = parsePrice(raw.price);
  if (Number.isNaN(price)) errors.price = 'Isi harga dengan angka.';
  else if (price > 1_000_000_000) errors.price = 'Harga terlalu besar.';

  const location = str(raw.location);
  if (cfg.locationRequired && !location) errors.location = `${cfg.locationLabel} wajib diisi.`;
  if (location.length > 120) errors.location = 'Lokasi maksimal 120 karakter.';

  const address = str(raw.address);
  if (address.length > 300) errors.address = 'Alamat maksimal 300 karakter.';

  const mapsUrl = str(raw.mapsUrl);
  if (mapsUrl && !/^https:\/\/[^\s]+$/.test(mapsUrl)) errors.mapsUrl = 'Link peta harus diawali https://';
  if (mapsUrl.length > 500) errors.mapsUrl = 'Link peta terlalu panjang.';

  const summary = str(raw.summary);
  if (summary.length > 200) errors.summary = 'Ringkasan maksimal 200 karakter.';
  const description = str(raw.description);
  if (description.length > 5000) errors.description = 'Deskripsi maksimal 5000 karakter.';

  const imagesRaw = Array.isArray(raw.images) ? raw.images.map(str).filter(Boolean) : [];
  if (imagesRaw.length > MAX_LISTING_IMAGES) errors.images = `Maksimal ${MAX_LISTING_IMAGES} foto.`;
  if (imagesRaw.some((u) => !isSafeImage(u))) errors.images = 'Ada foto dengan alamat tidak valid.';

  const meta: Record<string, string> = {};
  for (const f of cfg.fields) {
    const v = str(raw[`meta_${f.key}`]);
    if (!v) continue;
    if (f.type === 'number' && !/^\d{1,6}$/.test(v)) errors[`meta_${f.key}`] = `${f.label} harus berupa angka.`;
    else if (f.type === 'select' && !f.options?.includes(v)) errors[`meta_${f.key}`] = `${f.label} tidak valid.`;
    else if (v.length > 200) errors[`meta_${f.key}`] = `${f.label} terlalu panjang.`;
    else meta[f.key] = v;
  }

  const translations = parseListingTranslations(raw, category, errors);

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      category, title, summary, description, price, location, address, mapsUrl,
      images: imagesRaw, meta, translations,
      published: raw.published === 'on' || raw.published === true,
      featured: raw.featured === 'on' || raw.featured === true,
    },
  };
}

export function validateTestimonial(raw: Record<string, unknown>): Result<TestimonialInput> {
  const errors: Errors = {};
  const name = str(raw.name);
  const quote = str(raw.quote);
  const origin = str(raw.origin);
  const rating = Number.parseInt(str(raw.rating) || '5', 10);
  if (name.length < 2) errors.name = 'Nama minimal 2 karakter.';
  if (name.length > 80) errors.name = 'Nama maksimal 80 karakter.';
  if (quote.length < 10) errors.quote = 'Isi testimoni minimal 10 karakter.';
  if (quote.length > 600) errors.quote = 'Isi testimoni maksimal 600 karakter.';
  if (origin.length > 100) errors.origin = 'Keterangan maksimal 100 karakter.';
  const photo = str(raw.photo);
  if (photo && !isSafeImage(photo)) errors.photo = 'Alamat foto tidak valid.';
  if (!(rating >= 1 && rating <= 5)) errors.rating = 'Rating 1 sampai 5.';
  const translations: TestimonialTranslations = {};
  for (const lang of TRANSLATION_LANGS) {
    const quoteT = str(raw[`tr_${lang}_quote`]);
    const originT = str(raw[`tr_${lang}_origin`]);
    if (quoteT.length > 600) errors[`tr_${lang}_quote`] = 'Maksimal 600 karakter.';
    if (originT.length > 100) errors[`tr_${lang}_origin`] = 'Maksimal 100 karakter.';
    if (quoteT || originT) translations[lang] = { ...(quoteT && { quote: quoteT }), ...(originT && { origin: originT }) };
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, quote, origin, photo, translations, rating, published: raw.published === 'on' || raw.published === true } };
}
