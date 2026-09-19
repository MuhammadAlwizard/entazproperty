import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowSquareOut, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import {
  CATEGORY_CONFIG, formatRupiah, getListingBySlug, getSettings, highlightSpecs, isCategory, splitList,
} from '@enjaz/core';
import { Photo, Where } from '@/components/cards';
import { CATEGORY_HEADING, COMPANY, SITE_URL, jsonLd, listingHref, previewImage, waLink } from '@/lib/site';

type Props = { params: Promise<{ category: string; slug: string }> };

async function load(category: string, slug: string) {
  if (!isCategory(category)) return null;
  return getListingBySlug(category, slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const l = await load(category, slug);
  if (!l) return {};
  const where = l.location ? ` di ${l.location}` : '';
  const title = `${l.title}${l.location ? `, ${l.location}` : ''}`;
  const description =
    (l.summary || l.description).slice(0, 155) ||
    `${CATEGORY_CONFIG[l.category].label}${where} dari ${COMPANY}, ${formatRupiah(l.price)} per ${CATEGORY_CONFIG[l.category].priceUnit}.`;
  const image = previewImage(l);
  return {
    title,
    description,
    alternates: { canonical: listingHref(l) },
    openGraph: { type: 'website', title, description, url: listingHref(l), ...(image && { images: [{ url: image }] }) },
    twitter: { card: 'summary_large_image', title, description, ...(image && { images: [image] }) },
  };
}

export default async function ListingPage({ params }: Props) {
  const { category, slug } = await params;
  const l = await load(category, slug);
  if (!l) notFound();

  const cfg = CATEGORY_CONFIG[l.category];
  const settings = await getSettings();
  const url = `${SITE_URL}${listingHref(l)}`;
  const wa = waLink(settings.whatsapp, `Halo, saya tertarik dengan ${l.title}${l.location ? ` (${l.location})` : ''}. ${url}`);
  const specs = highlightSpecs(l);
  const lists = [
    { label: 'Fasilitas', items: splitList(l.meta.fasilitas) },
    { label: 'Sudah termasuk', items: splitList(l.meta.termasuk) },
  ].filter((x) => x.items.length);

  const mapQuery = encodeURIComponent(l.address || l.location);
  const mapsLink = l.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const showMap = l.category === 'villa' && Boolean(l.address || l.location);

  // Structured data. Prices are public list prices only; no stock or internal numbers.
  const offer = {
    '@type': 'Offer', price: l.price, priceCurrency: 'IDR', availability: 'https://schema.org/InStock', url,
  };
  const base = { name: l.title, description: l.summary || l.description, image: l.images.map((i) => (i.startsWith('/') ? `${SITE_URL}${i}` : i)), url };
  const structured =
    l.category === 'villa'
      ? { '@context': 'https://schema.org', '@type': 'LodgingBusiness', ...base, address: { '@type': 'PostalAddress', streetAddress: l.address || undefined, addressLocality: l.location, addressCountry: 'ID' }, priceRange: `${formatRupiah(l.price)} per malam` }
      : l.category === 'tour'
        ? { '@context': 'https://schema.org', '@type': 'TouristTrip', ...base, touristType: 'Wisatawan', offers: offer }
        : { '@context': 'https://schema.org', '@type': 'Product', ...base, brand: { '@type': 'Organization', name: COMPANY }, offers: offer };

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: CATEGORY_HEADING[l.category], item: `${SITE_URL}/${l.category}` },
      { '@type': 'ListItem', position: 3, name: l.title, item: url },
    ],
  };

  const [main, ...others] = l.images;

  return (
    <article className="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }} />

      <nav className="crumbs" aria-label="Jejak halaman">
        <Link href="/">Beranda</Link> / <Link href={`/${l.category}`}>{CATEGORY_HEADING[l.category]}</Link> / <span aria-current="page">{l.title}</span>
      </nav>

      <div className={`gallery ${others.length ? 'gallery-multi' : ''}`}>
        <div className="frame gallery-main"><Photo src={main} alt={l.title} eager /></div>
        {others.slice(0, 4).map((src, i) => (
          <div className="frame" key={src}><Photo src={src} alt={`${l.title}, foto ${i + 2}`} /></div>
        ))}
      </div>
      {others.length > 4 && (
        <div className="gallery-more" aria-label="Foto lainnya">
          {others.slice(4).map((src, i) => (
            <div className="frame" key={src}><Photo src={src} alt={`${l.title}, foto ${i + 6}`} /></div>
          ))}
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-main">
          <h1>{l.title}</h1>
          <Where text={l.location} />
          {specs.length > 0 && (
            <ul className="chips" aria-label="Spesifikasi">
              {specs.map((s) => <li key={s}>{s}</li>)}
            </ul>
          )}
          {l.summary && <p className="lede">{l.summary}</p>}
          {l.description.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}

          {lists.map((g) => (
            <div key={g.label} className="detail-list">
              <h2>{g.label}</h2>
              <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}

          {showMap && (
            <div className="detail-map">
              <h2>Lokasi</h2>
              {l.address && <p>{l.address}</p>}
              <iframe
                title={`Peta lokasi ${l.title}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a className="text-link" href={mapsLink} target="_blank" rel="noopener noreferrer">
                Buka di Google Maps <ArrowSquareOut size={16} aria-hidden />
              </a>
            </div>
          )}
        </div>

        <aside className="booking" aria-label="Harga dan pemesanan">
          <p className="booking-price">
            <strong>{formatRupiah(l.price)}</strong>
            <span> / {cfg.priceUnit}</span>
          </p>
          {wa ? (
            <a className="btn btn-gold btn-block" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo size={20} weight="bold" aria-hidden /> Pesan<span className="wa-more"> lewat WhatsApp</span>
            </a>
          ) : (
            <p className="booking-note">Kontak pemesanan akan segera tersedia.</p>
          )}
          <p className="booking-note">Ketersediaan dan tanggal dikonfirmasi lewat chat sebelum pembayaran.</p>
        </aside>
      </div>
    </article>
  );
}
