import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Ticket, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { getBookingByToken, getSettings, listProofs } from '@enjaz/core';
import { ProofUpload } from '@/components/ProofUpload';
import { fill, formatDay, formatPrice, getDict, isLocale, localePath, pluralize } from '@/i18n';
import { waLink } from '@/lib/site';

type Props = { params: Promise<{ lang: string; token: string }> };

// The customer's private booking page. The token in the address is the only key, so it is never indexed
// and never sent to other sites in the Referer header.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDict(lang).booking.number, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

export default async function BookingStatusPage({ params }: Props) {
  const { lang, token } = await params;
  if (!isLocale(lang)) notFound();
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  const d = getDict(lang);
  const b = d.booking;
  const settings = await getSettings();
  const wa = waLink(settings.whatsapp, d.wa.booking(booking.code, booking.listingTitle));
  const unitKey = booking.category === 'villa' ? 'malam' : booking.category === 'tour' ? 'orang' : 'hari';
  const dates = booking.endDate && booking.endDate !== booking.startDate
    ? `${formatDay(lang, booking.startDate)} - ${formatDay(lang, booking.endDate)}`
    : formatDay(lang, booking.startDate);
  const pending = booking.status === 'pending';
  // The invoice appears once the admin has confirmed the dates and set the final amount.
  const invoiced = booking.total !== null && booking.status !== 'pending' && booking.status !== 'cancelled';
  const awaiting = booking.status === 'awaiting_payment' || booking.status === 'payment_review';
  const proofs = awaiting ? await listProofs(booking.id) : [];
  const lastProof = proofs.at(-1);
  const waDone = booking.status === 'payment_review' ? waLink(settings.whatsapp, d.wa.transferred(booking.code)) : null;
  const signed = (n: number) => (n < 0 ? `-${formatPrice(lang, -n)}` : formatPrice(lang, n));

  return (
    <div className="detail order-page">
      <header className="order-head">
        {(pending || booking.status === 'paid') && <CheckCircle size={40} weight="fill" className="order-icon" aria-hidden />}
        <h1>{pending ? b.doneTitle : b.statuses[booking.status]}</h1>
        {pending && <p>{b.doneText}</p>}
        {booking.status === 'paid' && <p>{b.paid}</p>}
        {(booking.status === 'paid' || booking.status === 'done') && (
          <Link className="btn btn-gold voucher-link" href={localePath(lang, `/pesanan/${booking.accessToken}/voucher`)}>
            <Ticket size={20} weight="bold" aria-hidden /> {b.voucher.open}
          </Link>
        )}
        {booking.status === 'cancelled' && booking.publicNote && <p>{b.reason}: {booking.publicNote}</p>}
      </header>

      <section className="order-card" aria-label={b.number}>
        <div className="order-code">
          <span>{b.number}</span>
          <strong><bdi className="num">{booking.code}</bdi></strong>
        </div>
        <dl className="order-facts">
          <div><dt>{b.status}</dt><dd><span className={`status status-${booking.status}`}>{b.statuses[booking.status]}</span></dd></div>
          <div>
            <dt>{b.item}</dt>
            <dd>
              {booking.listingSlug
                ? <Link className="text-link" href={localePath(lang, `/${booking.category}/${booking.listingSlug}`)}>{booking.listingTitle}</Link>
                : booking.listingTitle}
            </dd>
          </div>
          <div><dt>{b.dates}</dt><dd>{dates}</dd></div>
          {booking.category !== 'mobil' && booking.category !== 'motor' && (
            <div><dt>{b.people}</dt><dd>{pluralize(lang, booking.guests, d.plural.orang)}</dd></div>
          )}
          {!invoiced && (<div>
            <dt>{b.estimate}</dt>
            <dd>
              <strong><bdi className="num">{formatPrice(lang, booking.unitPrice * booking.units)}</bdi></strong>
              <small> (<bdi className="num">{formatPrice(lang, booking.unitPrice)}</bdi> x {pluralize(lang, booking.units, d.plural[unitKey])})</small>
            </dd>
          </div>)}
        </dl>
        {!invoiced && <p className="order-small">{b.estimateNote}</p>}
      </section>

      {invoiced && (
        <section className="order-card order-invoice" aria-labelledby="invoice-title">
          <h2 id="invoice-title">{b.invoice}</h2>
          <dl className="invoice-lines">
            <div>
              <dt>{b.base} <small>(<bdi className="num">{formatPrice(lang, booking.unitPrice)}</bdi> x {pluralize(lang, booking.units, d.plural[unitKey])})</small></dt>
              <dd><bdi className="num">{formatPrice(lang, booking.unitPrice * booking.units)}</bdi></dd>
            </div>
            {booking.extras.map((x, i) => (
              <div key={i}><dt>{x.label}</dt><dd><bdi className="num">{signed(x.amount)}</bdi></dd></div>
            ))}
            <div className="invoice-total"><dt>{b.total}</dt><dd><bdi className="num">{formatPrice(lang, booking.total ?? 0)}</bdi></dd></div>
          </dl>

          {awaiting && (
            settings.bankAccount ? (
              <div className="pay-box">
                <p className="pay-title">{b.payTo}</p>
                <dl>
                  <div><dt>{b.bank}</dt><dd>{settings.bankName}</dd></div>
                  <div><dt>{b.account}</dt><dd><bdi className="num pay-number">{settings.bankAccount}</bdi></dd></div>
                  <div><dt>{b.holder}</dt><dd>{settings.bankHolder}</dd></div>
                </dl>
                <p className="order-small">{b.payHint}</p>
              </div>
            ) : (
              <p className="order-small">{b.noBank}</p>
            )
          )}

          {awaiting && (
            <div className="proof-box">
              {booking.status === 'payment_review' ? (
                <>
                  <h3>{b.proof.reviewTitle}</h3>
                  <p>{b.proof.reviewText}</p>
                  {waDone && (
                    <a className="text-link" href={waDone} target="_blank" rel="noopener noreferrer">
                      <WhatsappLogo size={18} weight="bold" aria-hidden /> {b.proof.tellWa}
                    </a>
                  )}
                  <ProofUpload token={booking.accessToken} locale={lang} t={b.proof} label={b.proof.again} />
                </>
              ) : (
                <>
                  <h3>{b.proof.title}</h3>
                  {lastProof?.review === 'rejected' && (
                    <p className="proof-error">
                      {lastProof.rejectReason ? fill(b.proof.rejected, { reason: lastProof.rejectReason }) : b.proof.rejectedNoReason}
                    </p>
                  )}
                  <p>{b.proof.text}</p>
                  <ProofUpload token={booking.accessToken} locale={lang} t={b.proof} />
                </>
              )}
            </div>
          )}
          {settings.paymentTerms && (
            <div className="pay-terms">
              <h3>{b.terms}</h3>
              <p>{settings.paymentTerms}</p>
            </div>
          )}
        </section>
      )}

      <section className="order-next">
        {!pending ? null : wa ? (
          <>
            <p>{b.waHint}</p>
            <a className="btn btn-gold" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo size={20} weight="bold" aria-hidden /> {b.sendWa}
            </a>
          </>
        ) : (
          <p>{b.noWa}</p>
        )}
        <p className="order-small">{b.keepLink}</p>
      </section>
    </div>
  );
}
