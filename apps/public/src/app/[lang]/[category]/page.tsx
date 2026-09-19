import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCategory, listListings, localizeListing } from '@enjaz/core';
import { ListingCard } from '@/components/cards';
import { getDict, isLocale } from '@/i18n';
import { alternatesFor } from '@/lib/site';

type Props = { params: Promise<{ lang: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isCategory(category)) return {};
  const c = getDict(lang).categories[category];
  return {
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
        <p className="empty">{c.empty}</p>
      )}
    </section>
  );
}
