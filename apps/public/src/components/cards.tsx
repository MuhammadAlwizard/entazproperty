import Link from 'next/link';
import { MapPin } from '@phosphor-icons/react/dist/ssr';
import { CATEGORY_CONFIG, formatRupiah, highlightSpecs, type Listing } from '@enjaz/core';
import { listingHref } from '@/lib/site';

export function Photo({ src, alt, eager = false }: { src?: string; alt: string; eager?: boolean }) {
  if (!src) {
    // Honest empty state: no photo uploaded yet in the admin panel.
    return (
      <div className="photo photo-empty" role="img" aria-label={`${alt} (foto belum tersedia)`}>
        <img src="/logo-icon.png" alt="" width={48} height={60} />
      </div>
    );
  }
  return <img className="photo" src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

export function Price({ listing }: { listing: Listing }) {
  return (
    <p className="price">
      <strong>{formatRupiah(listing.price)}</strong>
      <span> / {CATEGORY_CONFIG[listing.category].priceUnit}</span>
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

function Specs({ listing }: { listing: Listing }) {
  const specs = highlightSpecs(listing);
  if (!specs.length) return null;
  return <p className="specs">{specs.join(' · ')}</p>;
}

/** Generic card for category pages */
export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={listingHref(listing)} className="list-card">
      <div className="frame"><Photo src={listing.images[0]} alt={listing.title} /></div>
      <h3>{listing.title}</h3>
      <Where text={listing.location} />
      <Specs listing={listing} />
      <Price listing={listing} />
    </Link>
  );
}
