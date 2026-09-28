// Booking rules that both the server and the visitor's browser need (the form shows a live estimate).
// No node or database imports here, so client components can import it through "@enjaz/core/booking-rules".
import type { Category } from './categories';

/**
 * The life of a booking. There is no deposit: the customer pays the full amount by bank transfer after the
 * admin confirms the dates, then uploads a screenshot of the transfer.
 *   pending -> awaiting_payment (admin confirmed, invoice sent) -> payment_review (proof uploaded; derived, never
 *   stored, see bookings.ts)
 *   -> paid (admin checked the bank statement) -> done, or cancelled at any point.
 * Only an admin moves a booking forward; an uploaded screenshot never marks anything as paid on its own.
 */
export const BOOKING_STATUSES = ['pending', 'awaiting_payment', 'payment_review', 'paid', 'done', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** How far ahead a visitor can book, and the longest stay or rental in one booking. */
export const BOOKING_MAX_DAYS_AHEAD = 365;
export const BOOKING_MAX_RANGE = 60;
export const BOOKING_MAX_GUESTS = 99;

/**
 * What the form asks for per category.
 * villa: check-in, check-out, guests (price per night).
 * mobil, motor: pickup and return date (price per day).
 * tour: one date and the number of people (price per person).
 */
export function bookingShape(category: Category): { end: boolean; guests: boolean } {
  if (category === 'tour') return { end: false, guests: true };
  if (category === 'villa') return { end: true, guests: true };
  return { end: true, guests: false };
}

/** Today's date in Indonesia (WIB, UTC+7) as YYYY-MM-DD. Customers and staff think in local days. */
export function todayWib(now = Date.now()): string {
  return new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
}

export function isIsoDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function addDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * How many price units a booking covers: nights for a villa, days for a vehicle (same-day return counts
 * as one day), people for a tour. Returns 0 when the input is not usable yet.
 */
export function bookingUnits(category: Category, start: string, end: string | null, guests: number): number {
  if (category === 'tour') return guests > 0 ? guests : 0;
  if (!end || !isIsoDate(start) || !isIsoDate(end)) return 0;
  const diff = daysBetween(start, end);
  if (category === 'villa') return diff > 0 ? diff : 0;
  return diff >= 0 ? Math.max(1, diff) : 0;
}

/** What an admin can do to a booking, and from which statuses. Checked again in the UPDATE itself (see setBookingStatus). */
export const BOOKING_ACTIONS = {
  confirm: { from: ['pending'], to: 'awaiting_payment' },
  markPaid: { from: ['awaiting_payment', 'payment_review'], to: 'paid' },
  complete: { from: ['paid'], to: 'done' },
  cancel: { from: ['pending', 'awaiting_payment', 'payment_review', 'paid'], to: 'cancelled' },
} as const satisfies Record<string, { from: readonly BookingStatus[]; to: BookingStatus }>;
export type BookingAction = keyof typeof BOOKING_ACTIONS;

/** The invoice can change until the customer has paid (or sent proof of paying) the amount on it. */
export const INVOICE_EDITABLE: readonly BookingStatus[] = ['pending', 'awaiting_payment'];

/** Statuses that wait on the admin: a new request, or a transfer screenshot to check. */
export const NEEDS_ACTION: readonly BookingStatus[] = ['pending', 'payment_review'];

export const MAX_EXTRA_ITEMS = 5;

export type ExtraItem = { label: string; amount: number };

export const invoiceTotal = (unitPrice: number, units: number, extras: ExtraItem[]) =>
  Math.max(0, unitPrice * units + extras.reduce((sum, x) => sum + x.amount, 0));

/** Where a booking came from. 'web' = the public form; the others are entered by an admin. */
export const BOOKING_SOURCES = ['web', 'whatsapp', 'phone', 'walkin', 'other'] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];
export const MANUAL_SOURCES = BOOKING_SOURCES.filter((s) => s !== 'web');

/** A booking an admin enters has already been agreed, so it starts confirmed, or already paid (paid on the spot). */
export const MANUAL_START = ['awaiting_payment', 'paid'] as const;
export type ManualStart = (typeof MANUAL_START)[number];
