import type { MetadataRoute } from 'next';
import { CATEGORIES, listListings } from '@enjaz/core';
import { LOCALES, LOCALE_META, localePath } from '@/i18n/config';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Entry = MetadataRoute.Sitemap[number];

/** One entry per language for a page, each listing all the other languages (hreflang). */
function page(path: string, lastModified: Date, changeFrequency: Entry['changeFrequency'], priority: number): Entry[] {
  const languages = {
    ...Object.fromEntries(LOCALES.map((l) => [LOCALE_META[l].htmlLang, `${SITE_URL}${localePath(l, path)}`])),
    'x-default': `${SITE_URL}${localePath('id', path)}`,
  };
  return LOCALES.map((l) => ({ url: `${SITE_URL}${localePath(l, path)}`, lastModified, changeFrequency, priority, alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const listings = await listListings({ publishedOnly: true });
  return [
    ...page('/', now, 'weekly', 1),
    ...CATEGORIES.flatMap((c) => page(`/${c}`, now, 'weekly', 0.8)),
    ...listings.flatMap((l) => page(`/${l.category}/${l.slug}`, new Date(l.updatedAt), 'weekly', 0.6)),
  ];
}
