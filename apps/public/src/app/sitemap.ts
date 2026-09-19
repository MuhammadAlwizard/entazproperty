import type { MetadataRoute } from 'next';
import { CATEGORIES, listListings } from '@enjaz/core';
import { SITE_URL, listingHref } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const listings = await listListings({ publishedOnly: true });
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...listings.map((l) => ({
      url: `${SITE_URL}${listingHref(l)}`,
      lastModified: new Date(l.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
