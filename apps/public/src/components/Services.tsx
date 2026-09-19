import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, listListings } from '@enjaz/core';
import { countLabel, formatPrice, getDict, localePath, unitLabel, type Locale } from '@/i18n';

/**
 * The four business lines as four large photo cards. Each links to its own
 * category page, so the landing page stays short. The photo is the cover of the
 * category's first listing (featured first), so it changes when the admin does.
 */
export async function Services({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const items = await Promise.all(CATEGORIES.map(async (category) => {
    const listings = await listListings({ category, publishedOnly: true });
    const cover = listings.find((l) => l.images[0])?.images[0];
    const cheapest = listings.length ? Math.min(...listings.map((l) => l.price)) : null;
    return { category, count: listings.length, cover, cheapest };
  }));

  return (
    <section id="layanan" className="sec sec-services" aria-labelledby="layanan-title">
      <div className="sec-head">
        <div>
          <h2 id="layanan-title">{d.services.title}</h2>
          <p>{d.services.note}</p>
        </div>
      </div>
      <ul className="services">
        {items.map(({ category, count, cover, cheapest }) => (
          <li key={category}>
            <Link href={localePath(locale, `/${category}`)} className="service">
              {cover && <img src={cover} alt="" loading="lazy" decoding="async" />}
              <span className="service-arrow" aria-hidden><ArrowUpRight size={20} weight="bold" className="flip-rtl" /></span>
              <h3>{d.categories[category].name}</h3>
              <p className="service-meta">
                {count > 0 ? (
                  <>
                    {countLabel(locale, category, count)}
                    {cheapest !== null && (
                      <>{' · '}{d.services.from} <bdi className="num">{formatPrice(locale, cheapest)}</bdi> / {unitLabel(locale, category)}</>
                    )}
                  </>
                ) : d.services.soon}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
