'use client';

import { useActionState, useState } from 'react';
import { bookingShape, MANUAL_SOURCES, type ManualStart } from '@enjaz/core/booking-rules';
import type { Category } from '@enjaz/core/categories';
import type { FormState } from '@/lib/form';
import { SubmitButton } from '@/components/SubmitButton';
import { LOCALES, LOCALE_META } from '@/i18n/config';
import { useI18n } from '@/i18n/client';
import { catText, fill } from '@/i18n/format';

export type ListingOption = { id: number; title: string; category: Category; price: number };

export function ManualBookingForm({ action, listings, today }: { action: (p: FormState, fd: FormData) => Promise<FormState>; listings: ListingOption[]; today: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const f = d.bookings.form;
  const err = state.errors ?? {};
  const v = (k: string, fb = '') => (state.values?.[k] as string | undefined) ?? fb;

  const [listingId, setListingId] = useState(() => v('listingId'));
  const listing = listings.find((l) => String(l.id) === listingId);
  const [price, setPrice] = useState(() => v('unitPrice'));
  const shape = listing ? bookingShape(listing.category) : { end: true, guests: true };
  const [start, setStart] = useState<ManualStart>(() => (v('start') === 'paid' ? 'paid' : 'awaiting_payment'));

  const error = (k: string) => err[k] && <em className="field-error">{err[k]}</em>;

  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}

      <fieldset className="group">
        <legend>{f.order}</legend>
        <label className="field">
          <span>{f.listing}</span>
          <select
            name="listingId" required value={listingId} aria-invalid={!!err.listingId}
            onChange={(e) => {
              setListingId(e.target.value);
              const next = listings.find((l) => String(l.id) === e.target.value);
              if (next) setPrice(String(next.price));
            }}
          >
            <option value="">{f.choose}</option>
            {(['villa', 'mobil', 'motor', 'tour'] as const).map((c) => {
              const items = listings.filter((l) => l.category === c);
              return items.length ? (
                <optgroup key={c} label={catText(d, c).label}>
                  {items.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </optgroup>
              ) : null;
            })}
          </select>
          {error('listingId')}
        </label>

        <div className="grid-2">
          <label className="field">
            <span>{f.startDate}</span>
            <input type="date" name="startDate" required defaultValue={v('startDate', today)} aria-invalid={!!err.startDate} />
            {error('startDate')}
          </label>
          {shape.end && (
            <label className="field">
              <span>{f.endDate}</span>
              <input type="date" name="endDate" required defaultValue={v('endDate')} aria-invalid={!!err.endDate} />
              {error('endDate')}
            </label>
          )}
        </div>
        <small className="hint" style={{ marginTop: -8 }}>{f.datesHint}</small>

        <div className="grid-2">
          {shape.guests && (
            <label className="field">
              <span>{f.guests}</span>
              <input type="number" name="guests" min={1} max={99} required defaultValue={v('guests', '1')} aria-invalid={!!err.guests} />
              {error('guests')}
            </label>
          )}
          <label className="field">
            <span>{fill(f.unitPrice, { unit: listing ? catText(d, listing.category).priceUnit : '...' })}</span>
            <input name="unitPrice" inputMode="numeric" dir="ltr" required value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!err.unitPrice} />
            <small className="hint">{f.unitPriceHint}</small>
            {error('unitPrice')}
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>{f.source}</span>
            <select name="source" defaultValue={v('source', 'whatsapp')}>
              {MANUAL_SOURCES.map((s) => <option key={s} value={s}>{d.bookings.sources[s]}</option>)}
            </select>
          </label>
          <fieldset className="field radio-row">
            <legend>{f.start}</legend>
            <label className="check"><input type="radio" name="start" value="awaiting_payment" checked={start === 'awaiting_payment'} onChange={() => setStart('awaiting_payment')} /> {f.startAwaiting}</label>
            <label className="check"><input type="radio" name="start" value="paid" checked={start === 'paid'} onChange={() => setStart('paid')} /> {f.startPaid}</label>
          </fieldset>
        </div>
        {start === 'paid' && <p className="reminder">{d.bookings.detail.paidReminder}</p>}
      </fieldset>

      <fieldset className="group">
        <legend>{f.customer}</legend>
        <div className="grid-2">
          <label className="field">
            <span>{f.name}</span>
            <input name="name" required maxLength={80} defaultValue={v('name')} aria-invalid={!!err.name} />
            {error('name')}
          </label>
          <label className="field">
            <span>{f.phone}</span>
            <input name="phone" type="tel" required dir="ltr" maxLength={24} defaultValue={v('phone')} aria-invalid={!!err.phone} />
            {error('phone')}
          </label>
          <label className="field">
            <span>{f.email}</span>
            <input name="email" type="email" dir="ltr" maxLength={200} defaultValue={v('email')} aria-invalid={!!err.email} />
            {error('email')}
          </label>
          <label className="field">
            <span>{f.lang}</span>
            <select name="locale" defaultValue={v('locale', 'id')}>
              {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_META[l].name}</option>)}
            </select>
            <small className="hint">{f.langHint}</small>
          </label>
          <label className="field span-2">
            <span>{f.note}</span>
            <textarea name="note" rows={2} maxLength={500} defaultValue={v('note')} aria-invalid={!!err.note} />
            {error('note')}
          </label>
        </div>
      </fieldset>

      <div className="form-actions"><SubmitButton>{f.save}</SubmitButton></div>
    </form>
  );
}
