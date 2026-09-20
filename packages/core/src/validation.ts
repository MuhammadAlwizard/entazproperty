import { CATEGORY_CONFIG, MAX_LISTING_IMAGES, TRANSLATION_LANGS, isCategory, translatableMetaFields, type Category } from './categories';
import { VALIDATION_ID, fillMessage, type ValidationMessages } from './messages';
import type { ListingInput, ListingTranslations, TestimonialInput, TestimonialTranslations } from './types';

// Business rules for content live here so the admin form and any future
// import/API path enforce exactly the same thing. See CLAUDE.md.
// The wording of the errors comes from the caller (see messages.ts); Indonesian is the default.

export type Errors = Record<string, string>;
export type Result<T> = { ok: true; data: T } | { ok: false; errors: Errors };

/** How error messages are worded. Everything is optional: no options means the built-in Indonesian text. */
export type ValidateOptions = {
  messages?: ValidationMessages;
  /** Label of a category-specific field in the reader's language (default: the label in categories.ts) */
  fieldLabel?: (category: Category, key: string) => string;
  /** Label of a category's location field in the reader's language */
  locationLabel?: (category: Category) => string;
};

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
function parseListingTranslations(raw: Record<string, unknown>, category: Category, errors: Errors, m: ValidationMessages): ListingTranslations {
  const out: ListingTranslations = {};
  const limits: [string, number][] = [['title', 160], ['summary', 200], ['description', 5000], ['location', 120]];
  for (const lang of TRANSLATION_LANGS) {
    const t: NonNullable<ListingTranslations[typeof lang]> = {};
    for (const [field, max] of limits) {
      const key = `tr_${lang}_${field}`;
      const v = str(raw[key]);
      if (!v) continue;
      if (v.length > max) errors[key] = fillMessage(m.maxChars, { max });
      else (t as Record<string, string>)[field] = v;
    }
    const meta: Record<string, string> = {};
    for (const f of translatableMetaFields(category)) {
      const key = `tr_${lang}_meta_${f.key}`;
      const v = str(raw[key]);
      if (!v) continue;
      if (v.length > 200) errors[key] = fillMessage(m.maxChars, { max: 200 });
      else meta[f.key] = v;
    }
    if (Object.keys(meta).length) t.meta = meta;
    if (Object.keys(t).length) out[lang] = t;
  }
  return out;
}

export function validateListing(raw: Record<string, unknown>, opts: ValidateOptions = {}): Result<ListingInput> {
  const m = opts.messages ?? VALIDATION_ID;
  const errors: Errors = {};

  const category = str(raw.category);
  if (!isCategory(category)) return { ok: false, errors: { category: m.chooseCategory } };
  const cfg = CATEGORY_CONFIG[category];
  const fieldLabel = (key: string, fallback: string) => opts.fieldLabel?.(category, key) ?? fallback;

  const title = str(raw.title);
  if (title.length < 3) errors.title = m.titleMin;
  if (title.length > 120) errors.title = m.titleMax;

  const price = parsePrice(raw.price);
  if (Number.isNaN(price)) errors.price = m.priceNumber;
  else if (price > 1_000_000_000) errors.price = m.priceTooBig;

  const location = str(raw.location);
  if (cfg.locationRequired && !location) errors.location = fillMessage(m.locationRequired, { label: opts.locationLabel?.(category) ?? cfg.locationLabel });
  if (location.length > 120) errors.location = m.locationMax;

  const address = str(raw.address);
  if (address.length > 300) errors.address = m.addressMax;

  const mapsUrl = str(raw.mapsUrl);
  if (mapsUrl && !/^https:\/\/[^\s]+$/.test(mapsUrl)) errors.mapsUrl = m.mapsHttps;
  if (mapsUrl.length > 500) errors.mapsUrl = m.mapsTooLong;

  const summary = str(raw.summary);
  if (summary.length > 200) errors.summary = m.summaryMax;
  const description = str(raw.description);
  if (description.length > 5000) errors.description = m.descriptionMax;

  const imagesRaw = Array.isArray(raw.images) ? raw.images.map(str).filter(Boolean) : [];
  if (imagesRaw.length > MAX_LISTING_IMAGES) errors.images = fillMessage(m.imagesMax, { max: MAX_LISTING_IMAGES });
  if (imagesRaw.some((u) => !isSafeImage(u))) errors.images = m.imagesInvalid;

  const meta: Record<string, string> = {};
  for (const f of cfg.fields) {
    const v = str(raw[`meta_${f.key}`]);
    if (!v) continue;
    const label = fieldLabel(f.key, f.label);
    if (f.type === 'number' && !/^\d{1,6}$/.test(v)) errors[`meta_${f.key}`] = fillMessage(m.fieldNumber, { label });
    else if (f.type === 'select' && !f.options?.includes(v)) errors[`meta_${f.key}`] = fillMessage(m.fieldInvalid, { label });
    else if (v.length > 200) errors[`meta_${f.key}`] = fillMessage(m.fieldTooLong, { label });
    else meta[f.key] = v;
  }

  const translations = parseListingTranslations(raw, category, errors, m);

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

export function validateTestimonial(raw: Record<string, unknown>, opts: Pick<ValidateOptions, 'messages'> = {}): Result<TestimonialInput> {
  const m = opts.messages ?? VALIDATION_ID;
  const errors: Errors = {};
  const name = str(raw.name);
  const quote = str(raw.quote);
  const origin = str(raw.origin);
  const rating = Number.parseInt(str(raw.rating) || '5', 10);
  if (name.length < 2) errors.name = m.nameMin;
  if (name.length > 80) errors.name = m.nameMax;
  if (quote.length < 10) errors.quote = m.quoteMin;
  if (quote.length > 600) errors.quote = m.quoteMax;
  if (origin.length > 100) errors.origin = m.originMax;
  const photo = str(raw.photo);
  if (photo && !isSafeImage(photo)) errors.photo = m.photoInvalid;
  if (!(rating >= 1 && rating <= 5)) errors.rating = m.ratingRange;
  const translations: TestimonialTranslations = {};
  for (const lang of TRANSLATION_LANGS) {
    const quoteT = str(raw[`tr_${lang}_quote`]);
    const originT = str(raw[`tr_${lang}_origin`]);
    if (quoteT.length > 600) errors[`tr_${lang}_quote`] = fillMessage(m.maxChars, { max: 600 });
    if (originT.length > 100) errors[`tr_${lang}_origin`] = fillMessage(m.maxChars, { max: 100 });
    if (quoteT || originT) translations[lang] = { ...(quoteT && { quote: quoteT }), ...(originT && { origin: originT }) };
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, quote, origin, photo, translations, rating, published: raw.published === 'on' || raw.published === true } };
}
