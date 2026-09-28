import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bookingAmount, getBookingByToken, getSettings, parseWhatsappNumbers, displayWhatsapp } from '@enjaz/core';
import { PrintButton } from '@/components/PrintButton';
import { fill, formatDay, formatPrice, getDict, isLocale, localePath, pluralize } from '@/i18n';
import { COMPANY } from '@/lib/site';

type Props = { params: Promise<{ lang: string; token: string }> };

// Printable proof of a paid booking, shown at check-in or vehicle pickup. Same private link as the booking page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDict(lang).booking.voucher.title, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

export default async function VoucherPage({ params }: Props) {
  const { lang, token } = await params;
  if (!isLocale(lang)) notFound();
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  const d = getDict(lang);
  const b = d.booking;
  const v = b.voucher;
  const back = localePath(lang, `/pesanan/${booking.accessToken}`);

  // Only a paid booking gets a voucher: a printout must never look valid for something unpaid.
  if (booking.status !== 'paid' && booking.status !== 'done') {
    return (
      <div className="detail order-page">
        <div className="coming-soon">
          <h1>{v.title}</h1>
          <p>{v.notReady}</p>
          <Link className="text-link" href={back}>{v.back}</Link>
        </div>
      </div>
    );
  }

  const settings = await getSettings();
  const phone = parseWhatsappNumbers(settings.whatsapp)[0];
  const unitKey = booking.category === 'villa' ? 'malam' : booking.category === 'tour' ? 'orang' : 'hari';
  const dates = booking.endDate && booking.endDate !== booking.startDate
    ? `${formatDay(lang, booking.startDate)} - ${formatDay(lang, booking.endDate)}`
    : formatDay(lang, booking.startDate);

  return (
    <div className="detail order-page voucher-page">
      <div className="voucher-actions no-print">
        <Link className="text-link" href={back}>{v.back}</Link>
        <PrintButton label={v.print} />
      </div>

      <article className="voucher" aria-label={v.title}>
        <header className="voucher-top">
          <img src="/logo-full.png" alt={COMPANY} className="voucher-logo" />
          <span className="voucher-stamp">{v.paid}</span>
        </header>

        <div className="voucher-code">
          <span>{b.number}</span>
          <strong><bdi className="num">{booking.code}</bdi></strong>
        </div>

        <dl className="voucher-facts">
          <div><dt>{v.customer}</dt><dd>{booking.name}</dd></div>
          <div><dt>{b.item}</dt><dd>{booking.listingTitle}</dd></div>
          <div><dt>{b.dates}</dt><dd>{dates}</dd></div>
          {booking.category !== 'mobil' && booking.category !== 'motor' && (
            <div><dt>{b.people}</dt><dd>{pluralize(lang, booking.guests, d.plural.orang)}</dd></div>
          )}
          <div>
            <dt>{b.total}</dt>
            <dd>
              <bdi className="num">{formatPrice(lang, bookingAmount(booking))}</bdi>
              <small> ({pluralize(lang, booking.units, d.plural[unitKey])})</small>
            </dd>
          </div>
          {booking.paidAt && (
            <div><dt>{b.status}</dt><dd>{fill(v.paidOn, { date: formatDay(lang, new Date(new Date(booking.paidAt).getTime() + 7 * 3600_000).toISOString().slice(0, 10)) })}</dd></div>
          )}
        </dl>

        <footer className="voucher-foot">
          <p>{v.show}</p>
          <p className="voucher-company">
            {COMPANY}
            {phone && <> · <bdi className="phone">{displayWhatsapp(phone)}</bdi></>}
            {settings.address && <> · {settings.address}</>}
          </p>
        </footer>
      </article>
    </div>
  );
}
