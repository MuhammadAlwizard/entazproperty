import type { Metadata } from 'next';
import Link from 'next/link';
import { listListings, todayWib } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { createManualBookingAction } from '../actions';
import { ManualBookingForm } from './ManualBookingForm';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.bookings.form.title };
}

export default async function NewBooking() {
  await requireAdmin();
  const { d } = await getI18n();
  const f = d.bookings.form;
  // Drafts included: a unit can be rented out before (or without) being shown on the website.
  const listings = (await listListings()).map((l) => ({ id: l.id, title: l.title, category: l.category, price: l.price }));

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/bookings" className="back">{d.bookings.detail.back}</Link>
          <h1>{f.title}</h1>
          <p className="muted">{f.lead}</p>
        </div>
      </header>
      <ManualBookingForm action={createManualBookingAction} listings={listings} today={todayWib()} />
    </>
  );
}
