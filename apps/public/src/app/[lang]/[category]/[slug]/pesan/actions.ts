'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { countRecentBookings, createBooking, findClashes, getListingBySlug, isCategory, todayWib, validateBooking } from '@enjaz/core';
import { getDict, isLocale, localePath } from '@/i18n';

export type BookingFormState = { errors?: Record<string, string>; values?: Record<string, string>; formError?: string };

// Spam brakes. A family booking a villa and a car sends two or three requests, not more.
const PER_IP_PER_HOUR = 5;
const PER_PHONE_PER_DAY = 3;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

/** lang, category and slug are bound on the page, but a Server Action can be called with anything, so all three are checked again. */
export async function createBookingAction(lang: string, category: string, slug: string, _prev: BookingFormState, fd: FormData): Promise<BookingFormState> {
  if (!isLocale(lang) || !isCategory(category)) redirect('/');
  const d = getDict(lang);

  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string' && !k.startsWith('$ACTION')) raw[k] = v;

  // Honeypot: the field is hidden from people, so only bots fill it. Pretend all is well and store nothing.
  if (raw.website) redirect(localePath(lang, `/${category}/${slug}`));
  delete raw.website;

  const listing = await getListingBySlug(category, slug);
  if (!listing) redirect(localePath(lang, `/${category}`));

  const minGuests = Number(listing.meta.minPeserta) || undefined;
  const result = validateBooking(raw, { category, minGuests }, { messages: d.booking.errors });
  if (!result.ok) return { errors: result.errors, values: raw, formError: d.booking.formError };

  const ip = await clientIp();
  const now = Date.now();
  const [byIp, byPhone] = await Promise.all([
    countRecentBookings({ ip }, new Date(now - 3600_000)),
    countRecentBookings({ phone: result.data.phone }, new Date(now - 86_400_000)),
  ]);
  if (byIp >= PER_IP_PER_HOUR || byPhone >= PER_PHONE_PER_DAY) return { values: raw, formError: d.booking.errors.tooMany };

  // One unit per listing: dates held by a confirmed booking cannot be requested again.
  const clashes = await findClashes({ listingId: listing.id, category, startDate: result.data.startDate, endDate: result.data.endDate }, { holdingOnly: true });
  if (clashes.length) return { values: raw, errors: { startDate: d.booking.errors.taken }, formError: d.booking.formError };

  const booking = await createBooking(result.data, listing, { locale: lang, ip, today: todayWib(now) });
  redirect(localePath(lang, `/pesanan/${booking.accessToken}`));
}
