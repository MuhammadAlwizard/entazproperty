'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { invoiceTotal, MAX_EXTRA_ITEMS, type ExtraItem } from '@enjaz/core/booking-rules';
import type { FormState } from '@/lib/form';
import { SubmitButton } from '@/components/SubmitButton';
import { useI18n } from '@/i18n/client';
import { fill, money } from '@/i18n/format';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

const toNumber = (v: string) => Number(v.replace(/[^\d-]/g, '')) || 0;

function IntentButton({ intent, primary, children }: { intent: string; primary?: boolean; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const { d } = useI18n();
  return (
    <button name="intent" value={intent} className={primary ? 'btn btn-primary' : 'btn btn-secondary'} disabled={pending}>
      {pending ? d.common.saving : children}
    </button>
  );
}

/** Invoice editor with a live total. While the booking is new, the main button saves AND confirms. */
export function InvoiceForm({ action, unitPrice, units, extras, unit, canConfirm, clash = false }: {
  action: Action; unitPrice: number; units: number; extras: ExtraItem[]; unit: string; canConfirm: boolean;
  /** The dates clash with a confirmed booking: confirming needs a deliberate tick */
  clash?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { locale, d } = useI18n();
  const t = d.bookings.detail;
  const err = state.errors ?? {};
  const v = (k: string, fb: string) => (state.values?.[k] as string | undefined) ?? fb;

  const [price, setPrice] = useState(() => v('unitPrice', String(unitPrice)));
  const [qty, setQty] = useState(() => v('units', String(units)));
  const [rows, setRows] = useState(() =>
    Array.from({ length: MAX_EXTRA_ITEMS }, (_, i) => ({
      label: v(`extra_label_${i}`, extras[i]?.label ?? ''),
      amount: v(`extra_amount_${i}`, extras[i] ? String(extras[i].amount) : ''),
    })),
  );
  const [shown, setShown] = useState(() => Math.max(1, extras.length));

  const filled = rows.filter((r) => r.label.trim() && r.amount.trim()).map((r) => ({ label: r.label, amount: toNumber(r.amount) }));
  const base = toNumber(price) * (Number(qty) || 0);
  const total = invoiceTotal(toNumber(price), Number(qty) || 0, filled);

  return (
    <form action={formAction} className="form-card invoice-form">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}
      <fieldset className="group">
        <legend>{t.invoice}</legend>
        <p className="hint" style={{ marginTop: -6 }}>{t.invoiceHint}</p>
        <div className="grid-2">
          <label className="field">
            <span>{fill(t.unitPrice, { unit })}</span>
            <input name="unitPrice" inputMode="numeric" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!err.unitPrice} required />
            {err.unitPrice && <em className="field-error">{err.unitPrice}</em>}
          </label>
          <label className="field">
            <span>{fill(t.units, { unit })}</span>
            <input name="units" inputMode="numeric" dir="ltr" value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!!err.units} required />
            {err.units && <em className="field-error">{err.units}</em>}
          </label>
        </div>

        <div className="field">
          <span>{t.extras}</span>
          {rows.slice(0, shown).map((r, i) => (
            <div className="extra-row" key={i}>
              <input
                name={`extra_label_${i}`} placeholder={t.extraLabel} aria-label={t.extraLabel} maxLength={80} value={r.label}
                onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                aria-invalid={!!err[`extra_label_${i}`]}
              />
              <input
                name={`extra_amount_${i}`} placeholder={t.extraAmount} aria-label={t.extraAmount} inputMode="numeric" dir="ltr" value={r.amount}
                onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                aria-invalid={!!err[`extra_amount_${i}`]}
              />
              {(err[`extra_label_${i}`] || err[`extra_amount_${i}`]) && (
                <em className="field-error span-2">{err[`extra_label_${i}`] ?? err[`extra_amount_${i}`]}</em>
              )}
            </div>
          ))}
          {shown < MAX_EXTRA_ITEMS && (
            <button type="button" className="btn-text add-row" onClick={() => setShown((n) => n + 1)}>+ {t.extraLabel}</button>
          )}
          <small className="hint">{t.extraHint}</small>
        </div>

        <dl className="invoice-sum" aria-live="polite">
          <div><dt>{t.subtotal}</dt><dd><bdi>{money(locale, base)}</bdi></dd></div>
          {filled.map((x, i) => (
            <div key={i}><dt>{x.label}</dt><dd><bdi>{x.amount < 0 ? `-${money(locale, -x.amount)}` : money(locale, x.amount)}</bdi></dd></div>
          ))}
          <div className="invoice-total"><dt>{t.total}</dt><dd><bdi>{money(locale, total)}</bdi></dd></div>
        </dl>
      </fieldset>

      {canConfirm && clash && (
        <label className="check force-check">
          <input type="checkbox" name="force" value="1" />
          <span>{t.forceConfirm}</span>
        </label>
      )}
      <div className="form-actions">
        {canConfirm && <IntentButton intent="confirm" primary>{t.confirm}</IntentButton>}
        <IntentButton intent="save" primary={!canConfirm}>{t.saveInvoice}</IntentButton>
      </div>
      {canConfirm && <p className="hint">{t.confirmHint}</p>}
    </form>
  );
}

/** One status step (mark paid, mark completed). The paid step carries the reminder to check the bank first. */
export function StepForm({ action, label, hint, reminder }: { action: Action; label: string; hint?: string; reminder?: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="step-form">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      {reminder && <p className="reminder">{reminder}</p>}
      <SubmitButton>{label}</SubmitButton>
      {hint && <p className="hint">{hint}</p>}
    </form>
  );
}

/**
 * Two-step red-text action with a reason the customer will see: cancel a booking, or reject a transfer proof.
 * Styled like the delete buttons, never a solid red block.
 */
export function ReasonForm({ action, open, reasonLabel, placeholder, yes, required = false }: {
  action: Action; open: string; reasonLabel: string; placeholder: string; yes: string; required?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  if (!asking) {
    return <button type="button" className="btn-danger-text" onClick={() => setAsking(true)}>{open}</button>;
  }
  return (
    <form action={formAction} className="cancel-form">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      <label className="field">
        <span>{reasonLabel}</span>
        <input name="reason" maxLength={300} placeholder={placeholder} required={required} autoFocus />
      </label>
      <div className="inline-confirm">
        <span>{d.bookings.detail.cancelSure}</span>
        <CancelConfirm label={yes} />
        <button type="button" className="btn-text" onClick={() => setAsking(false)}>{d.common.cancel}</button>
      </div>
    </form>
  );
}

function CancelConfirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { d } = useI18n();
  return <button className="btn-danger-text" disabled={pending}>{pending ? d.common.saving : label}</button>;
}

export function NoteForm({ action, note }: { action: Action; note: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const t = d.bookings.detail;
  return (
    <form action={formAction} className="form-card">
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}
      <fieldset className="group">
        <legend>{t.adminNote}</legend>
        <label className="field">
          <span className="sr-only">{t.adminNote}</span>
          <textarea name="adminNote" rows={3} maxLength={2000} defaultValue={(state.values?.adminNote as string | undefined) ?? note} />
          <small className="hint">{t.adminNoteHint}</small>
        </label>
        <div><SubmitButton>{t.saveNote}</SubmitButton></div>
      </fieldset>
    </form>
  );
}
