import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addDays, BOOKING_MAX_DAYS_AHEAD, getListingBySlug, isCategory, localizeListing, todayWib } from '@enjaz/core';
import { BookingForm } from '@/components/BookingForm';
import { Photo, Where } from '@/components/cards';
import { fill, getDict, isLocale, localePath, unitLabel, type Locale } from '@/i18n';
import { listingHref } from '@/lib/site';
import { createBookingAction } from './actions';

type Props = { params: Promise<{ lang: string; category: string; slug: string }> };

async function load(lang: Locale, category: string, slug: string) {
  if (!isCategory(category)) return null;
  const l = await getListingBySlug(category, slug);
  return l ? localizeListing(l, lang) : null;
}

// A form page: useful for visitors, useless in search results.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category, slug } = await params;
  if (!isLocale(lang)) return {};
  const l = await load(lang, category, slug);
  if (!l) return {};
  return { title: fill(getDict(lang).booking.title, { title: l.title }), robots: { index: false, follow: false } };
}

export default async function BookingPage({ params }: Props) {
  const { lang, category, slug } = await params;
  if (!isLocale(lang)) notFound();
  const l = await load(lang, category, slug);
  if (!l) notFound();

  const d = getDict(lang);
  const b = d.booking;
  const today = todayWib();
  const minGuests = Number(l.meta.minPeserta) || 0;
  const pluralKey = l.category === 'villa' ? 'malam' : l.category === 'tour' ? 'orang' : 'hari';

  return (
    <div className="detail book-page">
      <nav className="crumbs" aria-label={d.detail.crumbs}>
        <Link href={localePath(lang, '/')}>{d.detail.home}</Link> / <Link href={listingHref(lang, l)}>{l.title}</Link> / <span aria-current="page">{b.form}</span>
      </nav>

      <header className="book-head">
        <h1>{fill(b.title, { title: l.title })}</h1>
        <p>{b.intro}</p>
      </header>

      <BookingForm
        action={createBookingAction.bind(null, lang, l.category, l.slug)}
        locale={lang}
        category={l.category}
        price={l.price}
        unit={unitLabel(lang, l.category)}
        unitForms={d.plural[pluralKey]}
        today={today}
        maxDate={addDays(today, BOOKING_MAX_DAYS_AHEAD)}
        minGuests={minGuests}
        t={{ ...b, minGuests: minGuests ? fill(b.minGuests, { min: minGuests }) : '' }}
        summary={
          <>
            <div className="frame book-photo"><Photo src={l.images[0]} alt={l.title} noPhoto={d.detail.noPhoto} eager /></div>
            <div className="book-item">
              <strong>{l.title}</strong>
              <Where text={l.location} />
              <Link className="text-link" href={listingHref(lang, l)}>{fill(b.back, { title: l.title })}</Link>
            </div>
          </>
        }
      />
    </div>
  );
}
