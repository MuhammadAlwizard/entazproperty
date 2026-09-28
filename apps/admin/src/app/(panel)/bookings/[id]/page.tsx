import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Ticket, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { BOOKING_ACTIONS, INVOICE_EDITABLE, bookingAmount, getBookingById, listProofs, whatsappLink, type Booking } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { PUBLIC_URL } from '@/lib/public-url';
import { getI18n } from '@/i18n/server';
import { isLocale, LOCALE_META, type Locale } from '@/i18n/config';
import { dictionaries } from '@/i18n/dictionaries';
import { catText, dateTimeFormat, fill, formatDayRange, money } from '@/i18n/format';
import { invoiceAction, noteAction, rejectProofAction, statusAction } from '../actions';
import { InvoiceForm, NoteForm, ReasonForm, StepForm } from './BookingForms';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { d } = await getI18n();
  const b = await getBookingById(Number((await params).id) || 0);
  return { title: b ? fill(d.bookings.detail.title, { code: b.code }) : d.bookings.title };
}

/** The customer's private page, in the language they booked in. */
function customerUrl(b: Booking): string {
  const prefix = b.locale === 'en' || b.locale === 'ar' ? `/${b.locale}` : '';
  return `${PUBLIC_URL}${prefix}/pesanan/${b.accessToken}`;
}

/** Prefilled WhatsApp message to the customer, written in the customer's language, fitting the booking's status. */
function chatLink(b: Booking): string {
  const lang: Locale = isLocale(b.locale) ? b.locale : 'id';
  const d = dictionaries[lang];
  const wa = d.bookings.detail.wa;
  const template = b.status === 'awaiting_payment' ? wa.awaiting_payment : b.status === 'paid' ? wa.paid : wa.other;
  const text = fill(template, {
    name: b.name.split(' ')[0], item: b.listingTitle, code: b.code, total: money(lang, bookingAmount(b)),
    dates: formatDayRange(lang, b.startDate, b.endDate), url: customerUrl(b), voucher: `${customerUrl(b)}/voucher`,
  });
  return whatsappLink(b.phone, text);
}

export default async function BookingDetail({ params, searchParams }: Props) {
  await requireAdmin();
  const { locale, d } = await getI18n();
  const t = d.bookings.detail;
  const id = Number((await params).id);
  const b = Number.isInteger(id) && id > 0 ? await getBookingById(id) : null;
  if (!b) notFound();
  const { done } = await searchParams;
  const proofs = b.status === 'pending' ? [] : await listProofs(b.id);
  const fmt = dateTimeFormat(locale, 'short');

  const ct = catText(d, b.category);
  const can = (action: keyof typeof BOOKING_ACTIONS) => (BOOKING_ACTIONS[action].from as readonly string[]).includes(b.status);
  const editable = INVOICE_EDITABLE.includes(b.status);
  const doneText = done && done in t.done ? t.done[done as keyof typeof t.done] : null;
  const chat = (
    <a className="btn btn-wa" href={chatLink(b)} target="_blank" rel="noopener noreferrer">
      <WhatsappLogo size={18} weight="bold" aria-hidden /> {t.chat}
    </a>
  );

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/bookings" className="back">{t.back}</Link>
          <h1 dir="ltr" className="booking-title">{b.code}</h1>
          <p className="muted booking-sub">
            <span className={`pill status-${b.status}`}>{d.bookings.statuses[b.status]}</span>
            {fill(t.created, { date: fmt.format(new Date(b.createdAt)) })}
          </p>
        </div>
      </header>

      {doneText && <p className="notice notice-ok" role="status">{doneText}</p>}

      <div className="booking-layout">
        <div className="booking-main">
          {/* What to do now. The new-booking step lives in the invoice form (confirm = save + confirm). */}
          {b.status !== 'pending' && (
            <section className="group group-highlight step-card" aria-labelledby="next-title">
              <h2 id="next-title">{t.next}</h2>
              {(b.status === 'awaiting_payment' || b.status === 'payment_review' || b.status === 'paid') && chat}
              {(b.status === 'awaiting_payment' || b.status === 'payment_review' || proofs.length > 0) && (
                <div className="proofs">
                  <h3>{t.proofs}</h3>
                  {proofs.length === 0 ? (
                    <p className="muted small">{t.proofNone}</p>
                  ) : (
                    <ul className="proof-list">
                      {proofs.map((p) => (
                        <li key={p.id} className={`proof proof-${p.review}`}>
                          {p.ext === 'pdf' ? (
                            <a className="proof-pdf" href={`/bukti/${p.id}`}>{t.proofPdf}</a>
                          ) : (
                            <a href={`/bukti/${p.id}`} target="_blank" rel="noopener" title={t.proofOpen}>
                              <img src={`/bukti/${p.id}`} alt={t.proofs} loading="lazy" />
                            </a>
                          )}
                          <div className="proof-meta">
                            <span className={`pill proof-pill-${p.review}`}>{t.proofReview[p.review]}</span>
                            <small className="muted">{fill(t.proofUploaded, { date: fmt.format(new Date(p.createdAt)) })}</small>
                            {p.rejectReason && <small className="muted">{p.rejectReason}</small>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {can('markPaid') && (
                <StepForm
                  action={statusAction.bind(null, b.id, 'markPaid')}
                  label={b.status === 'payment_review' ? t.acceptPaid : t.markPaid}
                  reminder={t.paidReminder}
                />
              )}
              {b.status === 'payment_review' && (
                <ReasonForm
                  action={rejectProofAction.bind(null, b.id)} open={t.reject} reasonLabel={t.rejectReason}
                  placeholder={t.rejectPlaceholder} yes={t.rejectYes} required
                />
              )}
              {can('complete') && <StepForm action={statusAction.bind(null, b.id, 'complete')} label={t.complete} hint={t.completeHint} />}
              {(b.status === 'done' || b.status === 'cancelled') && (
                <p className="muted">{fill(t.closed, { status: d.bookings.statuses[b.status].toLowerCase() })}</p>
              )}
              {b.status === 'cancelled' && b.publicNote && <p className="muted small">{t.cancelReason}: {b.publicNote}</p>}
            </section>
          )}

          {editable ? (
            <InvoiceForm
              action={invoiceAction.bind(null, b.id)}
              unitPrice={b.unitPrice}
              units={b.units}
              extras={b.extras}
              unit={ct.priceUnit}
              canConfirm={b.status === 'pending'}
            />
          ) : (
            <section className="group" aria-labelledby="inv-title">
              <h2 id="inv-title">{t.invoice}</h2>
              <dl className="invoice-sum">
                <div><dt>{t.subtotal} <small className="muted">(<bdi>{money(locale, b.unitPrice)}</bdi> x {b.units} {ct.priceUnit})</small></dt><dd><bdi>{money(locale, b.unitPrice * b.units)}</bdi></dd></div>
                {b.extras.map((x, i) => (
                  <div key={i}><dt>{x.label}</dt><dd><bdi>{x.amount < 0 ? `-${money(locale, -x.amount)}` : money(locale, x.amount)}</bdi></dd></div>
                ))}
                <div className="invoice-total"><dt>{t.total}</dt><dd><bdi>{money(locale, bookingAmount(b))}</bdi></dd></div>
              </dl>
              {b.status !== 'cancelled' && <p className="hint">{t.invoiceLocked}</p>}
            </section>
          )}

          <NoteForm action={noteAction.bind(null, b.id)} note={b.adminNote} />

          {can('cancel') && (
            <div className="danger-zone">
              <ReasonForm
                action={statusAction.bind(null, b.id, 'cancel')} open={t.cancel} reasonLabel={t.cancelReason}
                placeholder={t.cancelReasonPlaceholder} yes={t.cancelYes}
              />
            </div>
          )}
        </div>

        <aside className="booking-side">
          <section className="group" aria-labelledby="cust-title">
            <h2 id="cust-title">{t.customer}</h2>
            <dl className="facts">
              <div><dt>{t.name}</dt><dd>{b.name}</dd></div>
              <div><dt>{t.phone}</dt><dd dir="ltr" className="cell-ltr">{b.phone}</dd></div>
              <div><dt>{t.email}</dt><dd className="cell-ltr">{b.email || t.none}</dd></div>
              <div><dt>{d.bookings.form.source}</dt><dd>{d.bookings.sources[b.source]}</dd></div>
              <div><dt>{t.lang}</dt><dd>{isLocale(b.locale) ? LOCALE_META[b.locale].name : b.locale}</dd></div>
              {b.note && <div><dt>{t.note}</dt><dd className="pre-line">{b.note}</dd></div>}
            </dl>
            {chat}
          </section>

          <section className="group" aria-labelledby="order-title">
            <h2 id="order-title">{t.order}</h2>
            <dl className="facts">
              <div>
                <dt>{t.item}</dt>
                <dd>
                  {b.listingId ? <Link className="text-link" href={`/listings/${b.listingId}`}>{b.listingTitle}</Link> : b.listingTitle}
                  <small className="muted cell-block">{ct.label}</small>
                </dd>
              </div>
              <div><dt>{t.dates}</dt><dd>{formatDayRange(locale, b.startDate, b.endDate)}</dd></div>
              {b.category !== 'mobil' && b.category !== 'motor' && <div><dt>{t.people}</dt><dd>{b.guests}</dd></div>}
            </dl>
          </section>

          <section className="group" aria-labelledby="link-title">
            <h2 id="link-title">{t.customerLink}</h2>
            <input className="link-box" readOnly value={customerUrl(b)} dir="ltr" aria-labelledby="link-title" />
            <p className="hint">{t.customerLinkHint}</p>
            {(b.status === 'paid' || b.status === 'done') && (
              <a className="btn btn-secondary" href={`${customerUrl(b)}/voucher`} target="_blank" rel="noopener noreferrer">
                <Ticket size={18} aria-hidden /> {t.voucher}
              </a>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
