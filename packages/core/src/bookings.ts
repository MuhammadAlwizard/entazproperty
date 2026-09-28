import { randomBytes, randomInt } from 'node:crypto';
import { exec, isDuplicateError, parseJson, q, q1 } from './db';
import {
  BOOKING_ACTIONS, NEEDS_ACTION, INVOICE_EDITABLE, type BookingAction, type BookingSource, type BookingStatus, type ExtraItem, type ManualStart,
} from './booking-rules';
import type { Category } from './categories';
import type { Listing } from './types';
import type { BookingInput, InvoiceInput } from './validation';

export type Booking = {
  id: number;
  /** Shown to the customer and staff, e.g. EIP-250928-K7Q3 */
  code: string;
  /** Secret part of the customer's link. Never show it in lists or logs. */
  accessToken: string;
  status: BookingStatus;
  listingId: number | null;
  category: Category;
  listingTitle: string;
  listingSlug: string;
  unitPrice: number;
  units: number;
  startDate: string;
  endDate: string | null;
  guests: number;
  name: string;
  phone: string;
  email: string;
  note: string;
  locale: string;
  createdAt: string;
  /** 'web' or how the admin got it (WhatsApp, phone, walk-in) */
  source: BookingSource;
  /** Invoice lines added by the admin (negative = discount) */
  extras: ExtraItem[];
  /** Final amount, null until the admin confirms. Before that the customer only sees unitPrice x units. */
  total: number | null;
  /** Private to the admin panel */
  adminNote: string;
  /** Shown on the customer's page */
  publicNote: string;
  confirmedAt: string | null;
  paidAt: string | null;
};

type BookingRow = {
  id: number; code: string; access_token: string; status: BookingStatus; listing_id: number | null; category: Category;
  listing_title: string; listing_slug: string; unit_price: number; units: number; start_date: Date | string; end_date: Date | string | null;
  guests: number; customer_name: string; phone: string; email: string; note: string; locale: string; created_at: Date;
  extra_items: string | null; total: number | null; admin_note: string | null; public_note: string; confirmed_at: Date | null; paid_at: Date | null;
  new_proofs: number; source: BookingSource;
};

/**
 * "Proof received" (payment_review) is never stored: the public app may only INSERT a proof, not change a booking.
 * A booking awaiting payment that has a proof nobody reviewed yet is shown as payment_review.
 */
const NEW_PROOF = "EXISTS (SELECT 1 FROM payment_proofs p WHERE p.booking_id = b.id AND p.review = 'new')";
const SELECT_BOOKING = `SELECT b.*, (SELECT COUNT(*) FROM payment_proofs p WHERE p.booking_id = b.id AND p.review = 'new') AS new_proofs FROM bookings b`;

/** SQL condition for one shown status (see NEW_PROOF). */
function statusCondition(s: BookingStatus): { sql: string; args: string[] } {
  if (s === 'payment_review') return { sql: `(b.status = 'awaiting_payment' AND ${NEW_PROOF})`, args: [] };
  if (s === 'awaiting_payment') return { sql: `(b.status = 'awaiting_payment' AND NOT ${NEW_PROOF})`, args: [] };
  return { sql: 'b.status = ?', args: [s] };
}

// DATE columns arrive as a JS Date at UTC midnight (the pool runs in UTC), or as a string on some servers.
const isoDay = (v: Date | string) => (typeof v === 'string' ? v.slice(0, 10) : v.toISOString().slice(0, 10));

const toBooking = (r: BookingRow): Booking => ({
  id: r.id, code: r.code, accessToken: r.access_token,
  status: r.status === 'awaiting_payment' && Number(r.new_proofs) > 0 ? 'payment_review' : r.status,
  listingId: r.listing_id, category: r.category,
  listingTitle: r.listing_title, listingSlug: r.listing_slug, unitPrice: r.unit_price, units: r.units,
  startDate: isoDay(r.start_date), endDate: r.end_date ? isoDay(r.end_date) : null, guests: r.guests,
  name: r.customer_name, phone: r.phone, email: r.email, note: r.note, locale: r.locale,
  createdAt: new Date(r.created_at).toISOString(), source: r.source ?? 'web',
  extras: parseJson<ExtraItem[]>(r.extra_items, []), total: r.total, adminNote: r.admin_note ?? '', publicNote: r.public_note ?? '',
  confirmedAt: r.confirmed_at ? new Date(r.confirmed_at).toISOString() : null, paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null,
});

/** What the customer owes: the admin's total once confirmed, otherwise the estimate. */
export const bookingAmount = (b: Pick<Booking, 'total' | 'unitPrice' | 'units'>) => b.total ?? b.unitPrice * b.units;

/** No 0/O or 1/I, so the code survives being read out over the phone. */
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function newCode(today: string): string {
  let tail = '';
  for (let i = 0; i < 4; i++) tail += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return `EIP-${today.slice(2).replace(/-/g, '')}-${tail}`;
}

export async function createBooking(
  input: BookingInput,
  listing: Pick<Listing, 'id' | 'category' | 'title' | 'slug' | 'price'>,
  meta: { locale: string; ip: string; today: string },
  /** Entered by an admin: already confirmed (or paid), with the price the admin agreed. The public form never passes this. */
  manual?: { source: BookingSource; start: ManualStart; unitPrice: number; createdBy: string },
): Promise<Booking> {
  const now = new Date();
  const unitPrice = manual ? manual.unitPrice : listing.price;
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newCode(meta.today);
    const token = randomBytes(24).toString('base64url'); // 32 characters
    try {
      await exec(
        `INSERT INTO bookings (code, access_token, listing_id, category, listing_title, listing_slug, unit_price, units,
           start_date, end_date, guests, customer_name, phone, email, note, locale, ip
           ${manual ? ', status, total, confirmed_at, paid_at, source, created_by' : ''})
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?${manual ? ',?,?,?,?,?,?' : ''})`,
        [code, token, listing.id, listing.category, listing.title.slice(0, 160), listing.slug, unitPrice, input.units,
          input.startDate, input.endDate, input.guests, input.name, input.phone, input.email, input.note,
          meta.locale.slice(0, 5), meta.ip.slice(0, 64),
          ...(manual
            ? [manual.start, unitPrice * input.units, now, manual.start === 'paid' ? now : null, manual.source, manual.createdBy.slice(0, 200)]
            : [])],
      );
      return (await getBookingByToken(token))!;
    } catch (e) {
      if (isDuplicateError(e)) continue; // code taken today, draw again
      throw e;
    }
  }
  throw new Error('Tidak bisa membuat nomor booking unik.');
}

const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

export async function getBookingByToken(token: string): Promise<Booking | null> {
  if (!TOKEN_RE.test(token)) return null; // strict pattern: nothing else reaches the query
  const r = await q1<BookingRow>(`${SELECT_BOOKING} WHERE b.access_token = ?`, [token]);
  return r ? toBooking(r) : null;
}

/** Spam brake for the public form: requests from one IP address, or for one phone number, since a moment. */
export async function countRecentBookings(by: { ip?: string; phone?: string }, since: Date): Promise<number> {
  if (by.ip) {
    const r = await q1<{ n: number }>('SELECT COUNT(*) AS n FROM bookings WHERE ip = ? AND created_at > ?', [by.ip.slice(0, 64), since]);
    return Number(r?.n ?? 0);
  }
  if (by.phone) {
    const r = await q1<{ n: number }>('SELECT COUNT(*) AS n FROM bookings WHERE phone = ? AND created_at > ?', [by.phone, since]);
    return Number(r?.n ?? 0);
  }
  return 0;
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const r = await q1<BookingRow>(`${SELECT_BOOKING} WHERE b.id = ?`, [id]);
  return r ? toBooking(r) : null;
}

/** Newest first. `statuses` empty = all. `search` matches the booking code, customer name or phone. */
export async function listBookings(opts: { statuses?: readonly BookingStatus[]; search?: string; limit?: number } = {}): Promise<Booking[]> {
  const where: string[] = [];
  const args: string[] = [];
  if (opts.statuses?.length) {
    const parts = opts.statuses.map(statusCondition);
    where.push(`(${parts.map((p) => p.sql).join(' OR ')})`);
    args.push(...parts.flatMap((p) => p.args));
  }
  if (opts.search) {
    const like = `%${opts.search.replace(/[\\%_]/g, '')}%`;
    where.push('(b.code LIKE ? OR b.customer_name LIKE ? OR b.phone LIKE ?)');
    args.push(like, like, like);
  }
  const limit = ` LIMIT ${Math.max(1, Math.trunc(opts.limit ?? 200))}`;
  const sql = `${SELECT_BOOKING} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY b.created_at DESC, b.id DESC${limit}`;
  return (await q<BookingRow>(sql, args)).map(toBooking);
}

export async function countBookingsNeedingAction(): Promise<number> {
  const parts = NEEDS_ACTION.map(statusCondition);
  const r = await q1<{ n: number }>(`SELECT COUNT(*) AS n FROM bookings b WHERE ${parts.map((p) => p.sql).join(' OR ')}`, parts.flatMap((p) => p.args));
  return Number(r?.n ?? 0);
}

/** Saves the invoice. Refused (false) once the customer has paid or sent proof, so the amount they paid never changes under them. */
export async function saveBookingInvoice(id: number, inv: InvoiceInput): Promise<boolean> {
  const res = await exec(
    `UPDATE bookings SET unit_price = ?, units = ?, extra_items = ?, total = ?, updated_at = ?
      WHERE id = ? AND status IN (${INVOICE_EDITABLE.map(() => '?').join(',')})
        AND NOT EXISTS (SELECT 1 FROM payment_proofs p WHERE p.booking_id = bookings.id AND p.review = 'new')`,
    [inv.unitPrice, inv.units, JSON.stringify(inv.extras), inv.total, new Date(), id, ...INVOICE_EDITABLE],
  );
  return res.affectedRows === 1;
}

/**
 * Moves a booking along (see BOOKING_ACTIONS). The allowed "from" statuses are part of the UPDATE, so two admins
 * clicking at once, or a stale page, cannot skip a step. Returns false when the booking was not in a valid status.
 */
export async function setBookingStatus(id: number, action: BookingAction, publicNote?: string): Promise<boolean> {
  const { from, to } = BOOKING_ACTIONS[action];
  const now = new Date();
  const sets = ['status = ?', 'updated_at = ?'];
  const args: (string | number | Date)[] = [to, now];
  if (action === 'confirm') { sets.push('confirmed_at = ?', 'total = COALESCE(total, unit_price * units)'); args.push(now); }
  if (action === 'markPaid') { sets.push('paid_at = ?'); args.push(now); }
  if (publicNote !== undefined) { sets.push('public_note = ?'); args.push(publicNote.slice(0, 500)); }
  const res = await exec(
    `UPDATE bookings SET ${sets.join(', ')} WHERE id = ? AND status IN (${from.map(() => '?').join(',')})`,
    [...args, id, ...from],
  );
  return res.affectedRows === 1;
}

export async function saveBookingAdminNote(id: number, note: string): Promise<void> {
  await exec('UPDATE bookings SET admin_note = ?, updated_at = ? WHERE id = ?', [note.slice(0, 2000), new Date(), id]);
}

/* ------------------------------ Reports ------------------------------ */
// Days are Indonesian days (WIB, UTC+7). Timestamps are stored in UTC, so a WIB day is turned into a UTC range
// here and sent as values: no date functions in SQL (they differ between MySQL and MariaDB).

/** [start, end) of a WIB calendar day or month, as UTC instants. `iso` is YYYY-MM-DD or YYYY-MM. */
export function wibRange(iso: string): { from: Date; to: Date } {
  if (/^\d{4}-\d{2}$/.test(iso)) {
    const [y, m] = iso.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    return { from: new Date(`${iso}-01T00:00:00+07:00`), to: new Date(`${next}-01T00:00:00+07:00`) };
  }
  const from = new Date(`${iso}T00:00:00+07:00`);
  return { from, to: new Date(from.getTime() + 86_400_000) };
}

/** The WIB calendar day of a UTC instant, as YYYY-MM-DD. */
export const wibDay = (d: Date | string) => new Date(new Date(d).getTime() + 7 * 3600_000).toISOString().slice(0, 10);

/**
 * Revenue = bookings that are paid (or paid and completed), counted on the day they were marked paid.
 * A booking cancelled after payment no longer counts (treat it as refunded).
 */
export async function paidBookingsBetween(from: Date, to: Date): Promise<Booking[]> {
  return (await q<BookingRow>(
    `${SELECT_BOOKING} WHERE b.status IN ('paid', 'done') AND b.paid_at >= ? AND b.paid_at < ? ORDER BY b.paid_at ASC`,
    [from, to],
  )).map(toBooking);
}

/** Everything that happens on one WIB day: arrivals or pickups, departures or returns, new bookings, payments. */
export async function dailyReport(day: string): Promise<{ starts: Booking[]; ends: Booking[]; created: Booking[]; paid: Booking[] }> {
  const { from, to } = wibRange(day);
  const active = "b.status NOT IN ('cancelled')";
  const [starts, ends, created, paid] = await Promise.all([
    q<BookingRow>(`${SELECT_BOOKING} WHERE b.start_date = ? AND ${active} ORDER BY b.category, b.id`, [day]),
    q<BookingRow>(`${SELECT_BOOKING} WHERE b.end_date = ? AND b.end_date <> b.start_date AND ${active} ORDER BY b.category, b.id`, [day]),
    q<BookingRow>(`${SELECT_BOOKING} WHERE b.created_at >= ? AND b.created_at < ? ORDER BY b.created_at`, [from, to]),
    paidBookingsBetween(from, to),
  ]);
  return { starts: starts.map(toBooking), ends: ends.map(toBooking), created: created.map(toBooking), paid };
}

/** For the Excel export. basis 'created' = received in the range, 'paid' = paid in the range (for bookkeeping). */
export async function bookingsForExport(from: Date, to: Date, basis: 'created' | 'paid'): Promise<Booking[]> {
  if (basis === 'paid') return paidBookingsBetween(from, to);
  return (await q<BookingRow>(`${SELECT_BOOKING} WHERE b.created_at >= ? AND b.created_at < ? ORDER BY b.created_at ASC`, [from, to])).map(toBooking);
}
