import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowSquareOut, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { getListingBySlug, getSettings, isCategory, localizeListing, splitList } from '@enjaz/core';
import { Photo, Where } from '@/components/cards';
import { fill, formatPrice, getDict, isLocale, localePath, specLines, unitLabel, type Locale } from '@/i18n';
import { COMPANY, SITE_URL, alternatesFor, jsonLd, listingHref, previewImage, waLink } from '@/lib/site';

type Props = { params: Promise<{ lang: string; category: string; slug: string }> };

async function load(lang: Locale, category: string, slug: string) {
  if (!isCategory(category)) return null;
  const l = await getListingBySlug(category, slug);
  return l ? localizeListing(l, lang) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category, slug } = await params;
  if (!isLocale(lang)) return {};
  const l = await load(lang, category, slug);
  if (!l) return {};
  const d = getDict(lang);
  const title = `${l.title}${l.location ? `, ${l.location}` : ''}`;
  const description =
    (l.summary || l.description).slice(0, 155) ||
    d.detail.autoDescription(d.categories[l.category].name, l.location, formatPrice(lang, l.price), unitLabel(lang, l.category));
  const image = previewImage(l);
  const alt = alternatesFor(lang, `/${l.category}/${l.slug}`);
  return {
    title,
    description,
    alternates: alt,
    openGraph: { type: 'website', title, description, url: alt.canonical, ...(image && { images: [{ url: image }] }) },
    twitter: { card: 'summary_large_image', title, description, ...(image && { images: [image] }) },
  };
}

export default async function ListingPage({ params }: Props) {
  const { lang, category, slug } = await params;
  if (!isLocale(lang)) notFound();
  const l = await load(lang, category, slug);
  if (!l) notFound();

  const d = getDict(lang);
  const settings = await getSettings();
  const price = formatPrice(lang, l.price);
  const unit = unitLabel(lang, l.category);
  const url = `${SITE_URL}${listingHref(lang, l)}`;
  const wa = waLink(settings.whatsapp, d.wa.interested(l.title, l.location, url));
  const specs = specLines(l, lang);
  const lists = [
    { label: d.detail.amenities, items: splitList(l.meta.fasilitas) },
    { label: d.detail.included, items: splitList(l.meta.termasuk) },
  ].filter((x) => x.items.length);

  const mapQuery = encodeURIComponent(l.address || l.location);
  const mapsLink = l.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const showMap = l.category === 'villa' && Boolean(l.address || l.location);
  const categoryName = d.categories[l.category].name;

  // Structured data. Prices are public list prices only; no stock or internal numbers.
  const offer = { '@type': 'Offer', price: l.price, priceCurrency: 'IDR', availability: 'https://schema.org/InStock', url };
  const base = { name: l.title, description: l.summary || l.description, inLanguage: lang, image: l.images.map((i) => (i.startsWith('/') ? `${SITE_URL}${i}` : i)), url };
  const structured =
    l.category === 'villa'
      ? { '@context': 'https://schema.org', '@type': 'LodgingBusiness', ...base, address: { '@type': 'PostalAddress', streetAddress: l.address || undefined, addressLocality: l.location, addressCountry: 'ID' }, priceRange: d.detail.priceRange(price, unit) }
      : l.category === 'tour'
        ? { '@context': 'https://schema.org', '@type': 'TouristTrip', ...base, offers: offer }
        : { '@context': 'https://schema.org', '@type': 'Product', ...base, brand: { '@type': 'Organization', name: COMPANY }, offers: offer };

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: d.detail.home, item: `${SITE_URL}${localePath(lang, '/')}` },
      { '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE_URL}${localePath(lang, `/${l.category}`)}` },
      { '@type': 'ListItem', position: 3, name: l.title, item: url },
    ],
  };

  const [main, ...others] = l.images;
  const altOf = (n: number) => fill(d.detail.photoAlt, { title: l.title, n });

  return (
    <article className="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }} />

      <nav className="crumbs" aria-label={d.detail.crumbs}>
        <Link href={localePath(lang, '/')}>{d.detail.home}</Link> / <Link href={localePath(lang, `/${l.category}`)}>{categoryName}</Link> / <span aria-current="page">{l.title}</span>
      </nav>

      <div className={`gallery ${others.length ? 'gallery-multi' : ''}`}>
        <div className="frame gallery-main"><Photo src={main} alt={altOf(1)} noPhoto={d.detail.noPhoto} eager /></div>
        {others.slice(0, 4).map((src, i) => (
          <div className="frame" key={src}><Photo src={src} alt={altOf(i + 2)} noPhoto={d.detail.noPhoto} /></div>
        ))}
      </div>
      {others.length > 4 && (
        <div className="gallery-more" aria-label={d.detail.morePhotos}>
          {others.slice(4).map((src, i) => (
            <div className="frame" key={src}><Photo src={src} alt={altOf(i + 6)} noPhoto={d.detail.noPhoto} /></div>
          ))}
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-main">
          <h1>{l.title}</h1>
          <Where text={l.location} />
          {specs.length > 0 && (
            <ul className="chips" aria-label={d.detail.specs}>
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
              <h2>{d.detail.location}</h2>
              {l.address && <p>{l.address}</p>}
              <iframe
                title={fill(d.detail.mapTitle, { title: l.title })}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed&hl=${lang}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a className="text-link" href={mapsLink} target="_blank" rel="noopener noreferrer">
                {d.detail.openMaps} <ArrowSquareOut size={16} aria-hidden />
              </a>
            </div>
          )}
        </div>

        <aside className="booking" aria-label={d.detail.aside}>
          <p className="booking-price">
            <strong><bdi className="num">{price}</bdi></strong>
            <span> / {unit}</span>
          </p>
          {wa ? (
            <a className="btn btn-gold btn-block" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo size={20} weight="bold" aria-hidden /> {d.detail.book}<span className="wa-more">{d.detail.bookRest}</span>
            </a>
          ) : (
            <p className="booking-note">{d.detail.contactSoon}</p>
          )}
          <p className="booking-note">{d.detail.note}</p>
        </aside>
      </div>
    </article>
  );
}
