import Link from 'next/link';
import { MapPin } from '@phosphor-icons/react/dist/ssr';
import type { Listing } from '@enjaz/core';
import { formatPrice, getDict, specLines, unitLabel, type Locale } from '@/i18n';
import { listingHref } from '@/lib/site';

export function Photo({ src, alt, noPhoto, eager = false }: { src?: string; alt: string; noPhoto: string; eager?: boolean }) {
  if (!src) {
    // Honest empty state: no photo uploaded yet in the admin panel.
    return (
      <div className="photo photo-empty" role="img" aria-label={`${alt} (${noPhoto})`}>
        <img src="/logo-icon.png" alt="" width={48} height={60} />
      </div>
    );
  }
  return <img className="photo" src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

export function Price({ listing, locale }: { listing: Listing; locale: Locale }) {
  return (
    <p className="price">
      <strong><bdi className="num">{formatPrice(locale, listing.price)}</bdi></strong>
      <span> / {unitLabel(locale, listing.category)}</span>
    </p>
  );
}

export function Where({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="where">
      <MapPin size={16} weight="fill" aria-hidden />
      <span>{text}</span>
    </p>
  );
}

function Specs({ listing, locale }: { listing: Listing; locale: Locale }) {
  const specs = specLines(listing, locale);
  if (!specs.length) return null;
  return <p className="specs">{specs.join(' · ')}</p>;
}

/** Generic card for category pages. `listing` must already be localized (see localizeListing). */
export function ListingCard({ listing, locale }: { listing: Listing; locale: Locale }) {
  const d = getDict(locale);
  return (
    <Link href={listingHref(locale, listing)} className="list-card">
      <div className="frame"><Photo src={listing.images[0]} alt={listing.title} noPhoto={d.detail.noPhoto} /></div>
      <h3>{listing.title}</h3>
      <Where text={listing.location} />
      <Specs listing={listing} locale={locale} />
      <Price listing={listing} locale={locale} />
    </Link>
  );
}
