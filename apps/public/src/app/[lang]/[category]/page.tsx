import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCategory, listListings, localizeListing } from '@enjaz/core';
import { ListingCard } from '@/components/cards';
import Link from 'next/link';
import { getDict, isLocale, localePath } from '@/i18n';
import { alternatesFor } from '@/lib/site';

type Props = { params: Promise<{ lang: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isCategory(category)) return {};
  const c = getDict(lang).categories[category];
  // A category with nothing published is a thin page: keep it out of search results until it has listings.
  const hasListings = (await listListings({ category, publishedOnly: true, limit: 1 })).length > 0;
  return {
    ...(hasListings ? {} : { robots: { index: false, follow: true } }),
    title: c.title,
    description: c.description,
    alternates: alternatesFor(lang, `/${category}`),
    openGraph: { title: c.title, description: c.description, url: alternatesFor(lang, `/${category}`).canonical },
    twitter: { title: c.title, description: c.description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isCategory(category)) notFound();
  const c = getDict(lang).categories[category];
  const items = (await listListings({ category, publishedOnly: true })).map((l) => localizeListing(l, lang));

  return (
    <section className="sec page-head-sec">
      <div className="page-head">
        <h1>{c.name}</h1>
        <p>{c.intro}</p>
      </div>
      {items.length ? (
        <div className="cards">
          {items.map((l) => <ListingCard key={l.id} listing={l} locale={lang} />)}
        </div>
      ) : (
        <div className="coming-soon">
          <h2>{getDict(lang).services.soon}</h2>
          <p>{c.empty}</p>
          <Link href={`${localePath(lang, '/')}#layanan`} className="btn btn-gold">{getDict(lang).services.other}</Link>
        </div>
      )}
    </section>
  );
}
