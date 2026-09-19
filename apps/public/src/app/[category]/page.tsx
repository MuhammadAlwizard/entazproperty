import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCategory, listListings } from '@enjaz/core';
import { ListingCard } from '@/components/cards';
import { CATEGORY_HEADING, CATEGORY_SEO } from '@/lib/site';

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const seo = CATEGORY_SEO[category];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/${category}` },
    openGraph: { title: `${seo.title} | PT Enjaz Instan Properti`, description: seo.description, url: `/${category}` },
    twitter: { title: `${seo.title} | PT Enjaz Instan Properti`, description: seo.description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const items = await listListings({ category, publishedOnly: true });

  return (
    <section className="sec page-head-sec">
      <div className="page-head">
        <h1>{CATEGORY_HEADING[category]}</h1>
        <p>{CATEGORY_SEO[category].intro}</p>
      </div>
      {items.length ? (
        <div className="cards">
          {items.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <p className="empty">Belum ada listing di kategori ini. Silakan cek lagi nanti.</p>
      )}
    </section>
  );
}
