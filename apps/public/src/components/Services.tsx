import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, CATEGORY_CONFIG, formatRupiah, listListings, type Category } from '@enjaz/core';
import { CATEGORY_HEADING } from '@/lib/site';

const NOUN: Record<Category, string> = { villa: 'villa', mobil: 'mobil', motor: 'motor', tour: 'paket' };

/**
 * The four business lines as four large photo cards. Each links to its own
 * category page, so the landing page stays short. The photo is the cover of the
 * category's first listing (featured first), so it changes when the admin does.
 */
export async function Services() {
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
          <h2 id="layanan-title">Pilih layanan</h2>
          <p>Buka satu layanan untuk melihat semua listing, lokasi, dan harganya.</p>
        </div>
      </div>
      <ul className="services">
        {items.map(({ category, count, cover, cheapest }) => (
          <li key={category}>
            <Link href={`/${category}`} className="service">
              {cover && <img src={cover} alt="" loading="lazy" decoding="async" />}
              <span className="service-arrow" aria-hidden><ArrowUpRight size={20} weight="bold" /></span>
              <h3>{CATEGORY_HEADING[category]}</h3>
              <p className="service-meta">
                {count > 0
                  ? `${count} ${NOUN[category]}${cheapest !== null ? ` · mulai ${formatRupiah(cheapest)} / ${CATEGORY_CONFIG[category].priceUnit}` : ''}`
                  : 'Segera hadir'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
