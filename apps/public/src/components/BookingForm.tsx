'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { addDays, bookingShape, bookingUnits, BOOKING_MAX_GUESTS, datesOverlap } from '@enjaz/core/booking-rules';
import type { Category } from '@enjaz/core/categories';
import type { BookingFormState } from '@/app/[lang]/[category]/[slug]/pesan/actions';
import type { Locale } from '@/i18n/config';
import { formatDay, formatPrice, pluralize } from '@/i18n/plural';
import type { Dict, Forms } from '@/i18n/types';

type Props = {
  action: (prev: BookingFormState, fd: FormData) => Promise<BookingFormState>;
  locale: Locale;
  category: Category;
  price: number;
  unit: string;
  /** Plural forms of nights / days / people, for the estimate line */
  unitForms: Forms;
  /** Today in WIB, from the server, so the first render matches on both sides */
  today: string;
  maxDate: string;
  minGuests: number;
  /** Date ranges already held by confirmed bookings (one unit per listing) */
  taken: { start: string; end: string | null }[];
  t: Omit<Dict['booking'], 'minGuests'> & { minGuests: string };
  summary: ReactNode;
};

export function BookingForm({ action, locale, category, price, unit, unitForms, today, maxDate, minGuests, taken, t, summary }: Props) {
  const [state, formAction, pending] = useActionState<BookingFormState, FormData>(action, {});
  const v = (k: string, fallback = '') => state.values?.[k] ?? fallback;
  const err: Record<string, string> = { ...state.errors };
  const shape = bookingShape(category);

  // Dates and head count are controlled so the estimate follows every change.
  const [start, setStart] = useState(() => v('startDate'));
  const [end, setEnd] = useState(() => v('endDate'));
  const [guests, setGuests] = useState(() => v('guests', String(minGuests || 1)));

  const units = bookingUnits(category, start, shape.end ? end : null, Number(guests) || 0);
  const minEnd = start ? (category === 'villa' ? addDays(start, 1) : start) : today;

  const startLabel = category === 'villa' ? t.startVilla : category === 'tour' ? t.startTour : t.startVehicle;
  const endLabel = category === 'villa' ? t.endVilla : t.endVehicle;

  // A date error from the last submit no longer applies once the visitor picks other dates.
  if (start !== (state.values?.startDate ?? '') || end !== (state.values?.endDate ?? '')) {
    delete err.startDate;
    delete err.endDate;
  }
  // Same rule the server applies; shown as soon as the chosen dates clash, before sending.
  const clash = Boolean(start) && (!shape.end || Boolean(end)) && taken.some((r) => datesOverlap(category, start, shape.end ? end : null, r.start, r.end));
  if (clash && !err.startDate) err.startDate = t.errors.taken;
  const rangeText = (r: { start: string; end: string | null }) =>
    r.end && r.end !== r.start ? `${formatDay(locale, r.start)} - ${formatDay(locale, r.end)}` : formatDay(locale, r.start);

  const fieldError = (name: string) => err[name] && <em className="field-error" id={`${name}-error`}>{err[name]}</em>;
  const describedBy = (name: string, hint?: string) => [hint, err[name] && `${name}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="book-grid">
      <aside className="book-aside">{summary}</aside>

      <form action={formAction} className="book-form">
        {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}

        <div className="book-row">
          <label className="field">
            <span>{startLabel}</span>
            <input
              type="date" name="startDate" required min={today} max={maxDate} value={start}
              onChange={(e) => {
                setStart(e.target.value);
                if (end && e.target.value && end < e.target.value) setEnd('');
              }}
              aria-invalid={!!err.startDate} aria-describedby={describedBy('startDate')}
            />
            {fieldError('startDate')}
          </label>
          {shape.end && (
            <label className="field">
              <span>{endLabel}</span>
              <input
                type="date" name="endDate" required min={minEnd} max={maxDate} value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-invalid={!!err.endDate} aria-describedby={describedBy('endDate')}
              />
              {fieldError('endDate')}
            </label>
          )}
          {shape.guests && (
            <label className="field field-narrow">
              <span>{category === 'tour' ? t.guestsTour : t.guestsVilla}</span>
              <input
                type="number" name="guests" required inputMode="numeric" min={minGuests || 1} max={BOOKING_MAX_GUESTS} value={guests}
                onChange={(e) => setGuests(e.target.value)}
                aria-invalid={!!err.guests} aria-describedby={describedBy('guests', t.minGuests ? 'guests-hint' : undefined)}
              />
              {t.minGuests && <small className="hint" id="guests-hint">{t.minGuests}</small>}
              {fieldError('guests')}
            </label>
          )}
        </div>

        {taken.length > 0 && (
          <div className="taken">
            <span className="taken-title">{t.taken}</span>
            <ul>{taken.map((r) => <li key={`${r.start}-${r.end}`}><bdi className="num">{rangeText(r)}</bdi></li>)}</ul>
            <small className="hint">{t.takenHint}</small>
          </div>
        )}

        <label className="field">
          <span>{t.name}</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" defaultValue={v('name')} aria-invalid={!!err.name} aria-describedby={describedBy('name')} />
          {fieldError('name')}
        </label>

        <div className="book-row">
          <label className="field">
            <span>{t.phone}</span>
            <input
              name="phone" type="tel" required inputMode="tel" autoComplete="tel" maxLength={24} dir="ltr" defaultValue={v('phone')}
              aria-invalid={!!err.phone} aria-describedby={describedBy('phone', 'phone-hint')}
            />
            <small className="hint" id="phone-hint">{t.phoneHint}</small>
            {fieldError('phone')}
          </label>
          <label className="field">
            <span>{t.email} <small className="optional">({t.optional})</small></span>
            <input name="email" type="email" autoComplete="email" maxLength={200} dir="ltr" defaultValue={v('email')} aria-invalid={!!err.email} aria-describedby={describedBy('email')} />
            {fieldError('email')}
          </label>
        </div>

        <label className="field">
          <span>{t.note} <small className="optional">({t.optional})</small></span>
          <textarea name="note" rows={3} maxLength={500} placeholder={t.notePlaceholder} defaultValue={v('note')} aria-invalid={!!err.note} aria-describedby={describedBy('note')} />
          {fieldError('note')}
        </label>

        {/* Honeypot for bots: hidden from people and from screen readers, never filled by a human. */}
        <div className="hp" aria-hidden="true">
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div className="book-estimate" aria-live="polite">
          <span className="book-estimate-label">{t.estimate}</span>
          {units > 0 ? (
            <>
              <strong><bdi className="num">{formatPrice(locale, price * units)}</bdi></strong>
              <span className="book-estimate-calc">
                <bdi className="num">{formatPrice(locale, price)}</bdi> / {unit} x {pluralize(locale, units, unitForms)}
              </span>
            </>
          ) : (
            <span className="book-estimate-calc">{t.estimateEmpty}</span>
          )}
          <small>{t.estimateNote}</small>
        </div>

        <button type="submit" className="btn btn-gold btn-block" disabled={pending}>
          {pending ? t.sending : t.submit}
        </button>
        <p className="book-privacy">{t.privacy}</p>
      </form>
    </div>
  );
}
