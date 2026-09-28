import Link from 'next/link';
import type { Metadata } from 'next';
import { CaretLeft, CaretRight, DownloadSimple } from '@phosphor-icons/react/dist/ssr';
import {
  addDays, bookingAmount, CATEGORIES, countBookingsNeedingAction, countListings, dailyReport, isIsoDate, paidBookingsBetween,
  todayWib, wibDay, wibRange, type Booking,
} from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { LOCALE_META, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import { catText, fill, formatDay, formatDayRange, money } from '@/i18n/format';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.dashboard.title };
}

type SP = Promise<{ date?: string; month?: string }>;

const shiftMonth = (m: string, n: number) => {
  const [y, mm] = m.split('-').map(Number);
  const d = new Date(Date.UTC(y, mm - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const daysInMonth = (m: string) => {
  const [y, mm] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mm, 0)).getUTCDate();
};
const monthLabel = (locale: Locale, m: string) =>
  new Intl.DateTimeFormat(LOCALE_META[locale].dateLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${m}-01T00:00:00Z`));
const sum = (list: Booking[]) => list.reduce((s, b) => s + bookingAmount(b), 0);

function BookingLines({ items, d, locale, showAmount = false }: { items: Booking[]; d: Dict; locale: Locale; showAmount?: boolean }) {
  if (!items.length) return <p className="muted small">{d.reports.nothing}</p>;
  return (
    <ul className="day-list">
      {items.map((b) => (
        <li key={b.id}>
          <Link href={`/bookings/${b.id}`} className="day-code" dir="ltr">{b.code}</Link>
          <span className="day-main">
            {b.name}
            <small className="muted">{b.listingTitle} · {formatDayRange(locale, b.startDate, b.endDate)}</small>
          </span>
          {showAmount ? <bdi className="day-amount">{money(locale, bookingAmount(b))}</bdi> : <span className={`pill status-${b.status}`}>{d.bookings.statuses[b.status]}</span>}
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const { locale, d } = await getI18n();
  const t = d.reports;
  const sp = await searchParams;

  const today = todayWib();
  const thisMonth = today.slice(0, 7);
  const date = sp.date && isIsoDate(sp.date) ? sp.date : today;
  const month = sp.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month) ? sp.month : thisMonth;

  const [thisMonthPaid, lastMonthPaid, monthPaid, daily, toCheck, listings] = await Promise.all([
    paidBookingsBetween(wibRange(thisMonth).from, wibRange(thisMonth).to),
    paidBookingsBetween(wibRange(shiftMonth(thisMonth, -1)).from, wibRange(shiftMonth(thisMonth, -1)).to),
    month === thisMonth ? null : paidBookingsBetween(wibRange(month).from, wibRange(month).to),
    dailyReport(date),
    countBookingsNeedingAction(),
    countListings(),
  ]);
  const selected = monthPaid ?? thisMonthPaid;
  const todayRevenue = sum(thisMonthPaid.filter((b) => b.paidAt && wibDay(b.paidAt) === today));

  // Revenue per day of the selected month, for the bar chart and its table view.
  const perDay = Array.from({ length: daysInMonth(month) }, (_, i) => {
    const day = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { day, amount: sum(selected.filter((b) => b.paidAt && wibDay(b.paidAt) === day)) };
  });
  const max = Math.max(...perDay.map((x) => x.amount), 0);
  const total = sum(selected);
  const byCategory = CATEGORIES.map((c) => ({ c, list: selected.filter((b) => b.category === c) })).map((x) => ({ ...x, amount: sum(x.list) }));
  const bySource = [
    { label: t.web, list: selected.filter((b) => b.source === 'web') },
    { label: t.manual, list: selected.filter((b) => b.source !== 'web') },
  ].map((x) => ({ ...x, amount: sum(x.list) }));
  const share = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const q = (next: { date?: string; month?: string }) => {
    const p = new URLSearchParams();
    const dd = next.date ?? date;
    const mm = next.month ?? month;
    if (dd !== today) p.set('date', dd);
    if (mm !== thisMonth) p.set('month', mm);
    return p.size ? `/?${p}` : '/';
  };
  const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{d.dashboard.title}</h1>
          <p className="muted">{d.dashboard.lead}</p>
        </div>
      </header>

      {/* The one number that matters most, big. Everything else is secondary. */}
      <section className="hero-metric" aria-label={fill(t.revenueLabel, { month: monthLabel(locale, thisMonth) })}>
        <p className="metric-number metric-money"><bdi>{money(locale, sum(thisMonthPaid))}</bdi></p>
        <div>
          <p className="metric-label">{fill(t.revenueLabel, { month: monthLabel(locale, thisMonth) })}</p>
          <p className="muted metric-break">
            {t.today} <bdi>{money(locale, todayRevenue)}</bdi>   ·   {t.lastMonth} <bdi>{money(locale, sum(lastMonthPaid))}</bdi>
          </p>
          {toCheck > 0 && <Link href="/bookings" className="text-link metric-link">{fill(t.toCheck, { n: toCheck })}</Link>}
        </div>
      </section>

      <section className="report-block" aria-labelledby="daily-title">
        <div className="report-head">
          <div>
            <h2 id="daily-title">{t.dailyTitle}</h2>
            <p className="muted">{formatDay(locale, date)}</p>
          </div>
          <div className="report-nav">
            <Link href={q({ date: addDays(date, -1) })} className="icon-link" aria-label={t.prevDay}><CaretLeft size={18} className="flip-rtl" aria-hidden /></Link>
            <form className="date-form" aria-label={t.dailyAria}>
              {month !== thisMonth && <input type="hidden" name="month" value={month} />}
              <input type="date" name="date" defaultValue={date} aria-label={t.dailyAria} />
              <button className="btn btn-secondary btn-sm">{t.show}</button>
            </form>
            <Link href={q({ date: addDays(date, 1) })} className="icon-link" aria-label={t.nextDay}><CaretRight size={18} className="flip-rtl" aria-hidden /></Link>
            {date !== today && <Link href={q({ date: today })} className="text-link">{t.backToday}</Link>}
          </div>
        </div>
        <div className="day-grid">
          <div className="group">
            <h3>{t.starts} <span className="count">{daily.starts.length}</span></h3>
            <BookingLines items={daily.starts} d={d} locale={locale} />
          </div>
          <div className="group">
            <h3>{t.ends} <span className="count">{daily.ends.length}</span></h3>
            <BookingLines items={daily.ends} d={d} locale={locale} />
          </div>
          <div className="group">
            <h3>{t.created} <span className="count">{daily.created.length}</span></h3>
            <BookingLines items={daily.created} d={d} locale={locale} />
          </div>
          <div className="group">
            <h3>{t.paid} <span className="count">{daily.paid.length}</span></h3>
            <BookingLines items={daily.paid} d={d} locale={locale} showAmount />
            {daily.paid.length > 0 && <p className="day-total">{fill(t.paidTotal, { amount: money(locale, sum(daily.paid)) })}</p>}
          </div>
        </div>
      </section>

      <section className="report-block" aria-labelledby="rev-title">
        <div className="report-head">
          <div>
            <h2 id="rev-title">{t.revenueTitle} {monthLabel(locale, month)}</h2>
            <p className="muted small">{t.revenueNote}</p>
          </div>
          <div className="report-nav">
            <Link href={q({ month: shiftMonth(month, -1) })} className="icon-link" aria-label={t.prevMonth}><CaretLeft size={18} className="flip-rtl" aria-hidden /></Link>
            <strong className="report-total"><bdi>{money(locale, total)}</bdi></strong>
            <Link href={q({ month: shiftMonth(month, 1) })} className="icon-link" aria-label={t.nextMonth}><CaretRight size={18} className="flip-rtl" aria-hidden /></Link>
          </div>
        </div>

        {total === 0 ? (
          <div className="empty-state"><p className="muted">{t.noRevenue}</p></div>
        ) : (
          <>
            <div className="group">
              <h3>{t.perDay}</h3>
              {/* One series, one hue: no legend, the heading names it. Each bar shows its value on hover or focus. */}
              <div className="bars" role="group" aria-label={fill(t.chartAria, { month: monthLabel(locale, month) })}>
                <span className="bars-max" aria-hidden><bdi>{money(locale, max)}</bdi></span>
                <div className="bars-plot">
                  {perDay.map((x, i) => (
                    <div
                      key={x.day} className="bar-slot"
                      {...(x.amount > 0
                        ? { tabIndex: 0, role: 'img', 'aria-label': `${formatDay(locale, x.day)}: ${money(locale, x.amount)}` }
                        : { 'aria-hidden': true })}
                    >
                      {x.amount > 0 && <span className="bar" style={{ height: `${Math.max(2, (x.amount / max) * 100)}%` }} />}
                      {x.amount > 0 && <span className="bar-tip" aria-hidden>{formatDay(locale, x.day)}<br /><bdi>{money(locale, x.amount)}</bdi></span>}
                      {(i === 0 || (i + 1) % 5 === 0) && <span className="bar-label" aria-hidden>{i + 1}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <details className="table-view">
                <summary>{t.tableView}</summary>
                <table className="activity">
                  <thead><tr><th scope="col">{t.colDay}</th><th scope="col" className="num">{t.colAmount}</th></tr></thead>
                  <tbody>
                    {perDay.filter((x) => x.amount > 0).map((x) => (
                      <tr key={x.day}><td>{formatDay(locale, x.day)}</td><td className="num"><bdi>{money(locale, x.amount)}</bdi></td></tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>

            <div className="split-2">
              {[{ title: t.byCategory, rows: byCategory.map((x) => ({ key: x.c, label: catText(d, x.c).label, list: x.list, amount: x.amount })) },
                { title: t.bySource, rows: bySource.map((x) => ({ key: x.label, label: x.label, list: x.list, amount: x.amount })) }].map((block) => (
                <div className="group" key={block.title}>
                  <h3>{block.title}</h3>
                  <ul className="share-list">
                    {block.rows.map((r) => (
                      <li key={r.key}>
                        <div className="share-top">
                          <span>{r.label} <small className="muted">{fill(t.bookingsCount, { n: r.list.length })}</small></span>
                          <bdi className="share-amount">{money(locale, r.amount)}</bdi>
                        </div>
                        <div className="share-track"><span style={{ width: `${share(r.amount)}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="report-block group" aria-labelledby="export-title">
        <h2 id="export-title">{t.exportTitle}</h2>
        <p className="muted small">{t.exportLead}</p>
        <form action="/export/bookings" method="get" className="export-form">
          <label className="field"><span>{t.from}</span><input type="date" name="from" defaultValue={`${month}-01`} required /></label>
          <label className="field"><span>{t.to}</span><input type="date" name="to" defaultValue={monthEnd} required /></label>
          <label className="field">
            <span>{t.basis}</span>
            <select name="basis" defaultValue="created">
              <option value="created">{t.basisCreated}</option>
              <option value="paid">{t.basisPaid}</option>
            </select>
          </label>
          <button className="btn btn-primary"><DownloadSimple size={18} aria-hidden /> {t.download}</button>
        </form>
      </section>

      <p className="muted small">
        <Link href="/listings" className="text-link">{fill(t.listingsShown, { n: listings.published })}</Link>
      </p>
    </>
  );
}
