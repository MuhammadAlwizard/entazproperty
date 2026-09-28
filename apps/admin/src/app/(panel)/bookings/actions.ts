'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  MANUAL_SOURCES, MANUAL_START, createBooking, getListingById, parsePrice, todayWib, validateBooking,
  getBookingById, logAudit, reviewNewProofs, saveBookingAdminNote, saveBookingInvoice, setBookingStatus, validateInvoice, type BookingAction,
} from '@enjaz/core';
import { getClientIp, requireAdmin } from '@/lib/auth';
import { formToObject, type FormState } from '@/lib/form';
import { getDict } from '@/i18n/server';
import { isLocale } from '@/i18n/config';

/**
 * Saves the invoice. With intent=confirm (the "Confirm and issue invoice" button) it also confirms the booking,
 * so the customer never sees an invoice that was confirmed with unsaved numbers.
 */
export async function invoiceAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const t = d.bookings.detail;
  const booking = await getBookingById(id);
  if (!booking) redirect('/bookings');

  const raw = formToObject(fd);
  const result = validateInvoice(raw, { messages: d.invoiceErrors });
  if (!result.ok) return { errors: result.errors, values: raw, formError: result.errors.total ?? d.common.formError };
  if (!(await saveBookingInvoice(id, result.data))) return { values: raw, formError: t.stale };
  const ip = await getClientIp();
  await logAudit({ email: session.email, action: 'booking.invoice', target: booking.code, detail: { id, total: result.data.total }, ip });

  if (raw.intent === 'confirm') {
    if (!(await setBookingStatus(id, 'confirm'))) return { values: raw, formError: t.stale };
    await logAudit({ email: session.email, action: 'booking.confirm', target: booking.code, detail: { id }, ip });
    revalidatePath('/', 'layout'); // the sidebar count changes
    redirect(`/bookings/${id}?done=confirm`);
  }
  revalidatePath(`/bookings/${id}`);
  return { ok: t.invoiceSaved };
}

/** Mark paid, completed or cancelled. The allowed starting statuses are enforced by setBookingStatus. */
export async function statusAction(id: number, action: Exclude<BookingAction, 'confirm'>, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  if (!['markPaid', 'complete', 'cancel'].includes(action)) return { formError: d.bookings.detail.stale };
  const booking = await getBookingById(id);
  if (!booking) redirect('/bookings');

  const reason = action === 'cancel' ? String(fd.get('reason') ?? '').trim().slice(0, 500) : undefined;
  if (!(await setBookingStatus(id, action, reason))) return { formError: d.bookings.detail.stale };
  if (action === 'markPaid') await reviewNewProofs(id, 'accepted');
  await logAudit({ email: session.email, action: `booking.${action}`, target: booking.code, detail: { id, ...(reason && { reason }) }, ip: await getClientIp() });
  revalidatePath('/', 'layout'); // the sidebar count changes
  redirect(`/bookings/${id}?done=${action}`);
}

export async function noteAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const booking = await getBookingById(id);
  if (!booking) redirect('/bookings');
  const note = String(fd.get('adminNote') ?? '').trim();
  await saveBookingAdminNote(id, note);
  await logAudit({ email: session.email, action: 'booking.note', target: booking.code, detail: { id }, ip: await getClientIp() });
  revalidatePath(`/bookings/${id}`);
  return { ok: d.bookings.detail.noteSaved, values: { adminNote: note } };
}

/** The screenshot does not match the bank statement: the customer sees the reason and can upload again. */
export async function rejectProofAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const booking = await getBookingById(id);
  if (!booking) redirect('/bookings');
  const reason = String(fd.get('reason') ?? '').trim().slice(0, 300);
  if (!(await reviewNewProofs(id, 'rejected', reason))) return { formError: d.bookings.detail.stale };
  await logAudit({ email: session.email, action: 'booking.rejectProof', target: booking.code, detail: { id, ...(reason && { reason }) }, ip: await getClientIp() });
  revalidatePath('/', 'layout');
  redirect(`/bookings/${id}?done=rejectProof`);
}

/** A booking taken on WhatsApp, by phone or in person. It starts confirmed (or paid) with the price the admin agreed. */
export async function createManualBookingAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const f = d.bookings.form;
  const raw = formToObject(fd);
  const errors: Record<string, string> = {};

  const listing = /^\d{1,9}$/.test(String(raw.listingId ?? '')) ? await getListingById(Number(raw.listingId)) : null;
  if (!listing) return { errors: { listingId: f.listingMissing }, values: raw, formError: d.common.formError };

  const result = validateBooking(raw, { category: listing.category }, { messages: d.bookingErrors, allowPast: true });
  if (!result.ok) Object.assign(errors, result.errors);
  const unitPrice = parsePrice(raw.unitPrice);
  if (Number.isNaN(unitPrice) || unitPrice > 1_000_000_000) errors.unitPrice = f.priceBad;
  const source = (MANUAL_SOURCES as readonly string[]).includes(String(raw.source)) ? (raw.source as (typeof MANUAL_SOURCES)[number]) : 'other';
  const start = (MANUAL_START as readonly string[]).includes(String(raw.start)) ? (raw.start as (typeof MANUAL_START)[number]) : 'awaiting_payment';
  const locale = isLocale(raw.locale) ? raw.locale : 'id';
  if (!result.ok || Object.keys(errors).length) return { errors, values: raw, formError: d.common.formError };

  const booking = await createBooking(
    result.data, listing, { locale, ip: 'admin', today: todayWib() },
    { source, start, unitPrice, createdBy: session.email },
  );
  await logAudit({ email: session.email, action: 'booking.create', target: booking.code, detail: { id: booking.id, source, start }, ip: await getClientIp() });
  revalidatePath('/', 'layout');
  redirect(`/bookings/${booking.id}?done=created`);
}
