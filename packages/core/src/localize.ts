import type { TranslationLang } from './categories';
import type { Listing, Testimonial } from './types';

/** Site languages. Indonesian is the source language, the others come from admin-entered translations. */
export type Lang = 'id' | TranslationLang;

const pick = (translated: string | undefined, original: string) => (translated && translated.trim() ? translated : original);

/** Returns the listing with text in the requested language. Any field without a translation stays Indonesian. */
export function localizeListing(l: Listing, lang: Lang): Listing {
  if (lang === 'id') return l;
  const t = l.translations[lang];
  if (!t) return l;
  const meta = { ...l.meta };
  for (const [k, v] of Object.entries(t.meta ?? {})) if (v.trim()) meta[k] = v;
  return {
    ...l,
    title: pick(t.title, l.title),
    summary: pick(t.summary, l.summary),
    description: pick(t.description, l.description),
    location: pick(t.location, l.location),
    meta,
  };
}

export function localizeTestimonial(t: Testimonial, lang: Lang): Testimonial {
  if (lang === 'id') return t;
  const x = t.translations[lang];
  if (!x) return t;
  return { ...t, quote: pick(x.quote, t.quote), origin: pick(x.origin, t.origin) };
}
