import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { bookingAmount, listBookings, NEEDS_ACTION, type BookingStatus } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { catText, dateTimeFormat, fill, formatDayRange, money } from '@/i18n/format';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.bookings.title };
}

// Tabs, in the order the admin works through them. "action" (new + proof received) is the default.
const TABS = {
  action: NEEDS_ACTION,
  awaiting: ['awaiting_payment'],
  paid: ['paid'],
  done: ['done'],
  cancelled: ['cancelled'],
  all: [],
} as const satisfies Record<string, readonly BookingStatus[]>;
type Tab = keyof typeof TABS;
const isTab = (v: string | undefined): v is Tab => !!v && v in TABS;

export default async function Bookings({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  await requireAdmin();
  const { locale, d } = await getI18n();
  const t = d.bookings;
  const sp = await searchParams;
  const tab: Tab = isTab(sp.tab) ? sp.tab : 'action';
  const q = (sp.q ?? '').trim().slice(0, 60);
  // A search looks through every status, so an old booking number is always found.
  const items = await listBookings({ statuses: q ? [] : TABS[tab], search: q || undefined });
  const fmt = dateTimeFormat(locale, 'short');

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t.title}</h1>
          <p className="muted">{t.lead}</p>
        </div>
        <Link href="/bookings/new" className="btn btn-primary"><Plus size={18} aria-hidden /> {t.add}</Link>
      </header>

      <div className="toolbar">
        <div className="tabs" role="navigation" aria-label={t.filterAria}>
          {(Object.keys(TABS) as Tab[]).map((key) => {
            const active = !q && key === tab;
            return (
              <Link key={key} href={key === 'action' ? '/bookings' : `/bookings?tab=${key}`} className={active ? 'tab active' : 'tab'} aria-current={active ? 'page' : undefined}>
                {t.tabs[key]}
              </Link>
            );
          })}
        </div>
        <form className="search" role="search">
          <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} aria-label={t.searchAria} />
        </form>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>{q || tab !== 'action' ? t.noMatchTitle : t.emptyTitle}</h2>
          <p className="muted">{q || tab !== 'action' ? t.noMatchText : t.emptyText}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table table-bookings">
            <thead>
              <tr>
                <th scope="col">{t.colCode}</th>
                <th scope="col">{t.colCustomer}</th>
                <th scope="col">{t.colItem}</th>
                <th scope="col">{t.colDates}</th>
                <th scope="col" className="num">{t.colAmount}</th>
                <th scope="col">{t.colCreated}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/bookings/${b.id}`} className="row-link booking-code">
                      <span dir="ltr">{b.code}</span>
                    </Link>
                    <span className={`pill status-${b.status}`}>{t.statuses[b.status]}</span>
                  </td>
                  <td>
                    {b.name}
                    <small className="muted cell-block" dir="ltr">{b.phone}</small>
                    {b.source !== 'web' && <small className="muted cell-block">{fill(t.via, { source: t.sources[b.source] })}</small>}
                  </td>
                  <td>
                    {b.listingTitle}
                    <small className="muted cell-block">{catText(d, b.category).short}</small>
                  </td>
                  <td className="nowrap">{formatDayRange(locale, b.startDate, b.endDate)}</td>
                  <td className="num">
                    <bdi>{money(locale, bookingAmount(b))}</bdi>
                    {b.total === null && <small className="muted cell-block">{t.estimate}</small>}
                  </td>
                  <td className="nowrap muted small">{fmt.format(new Date(b.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
