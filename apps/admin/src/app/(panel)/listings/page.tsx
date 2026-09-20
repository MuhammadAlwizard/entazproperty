import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, CATEGORY_CONFIG, isCategory, listListings } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import { getI18n } from '@/i18n/server';
import { catText, money } from '@/i18n/format';
import { deleteListingAction } from './actions';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.listings.title };
}

type SP = Promise<{ cat?: string; q?: string; saved?: string; deleted?: string }>;

export default async function Listings({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const { locale, d } = await getI18n();
  const t = d.listings;
  const sp = await searchParams;
  const category = sp.cat && isCategory(sp.cat) ? sp.cat : undefined;
  const q = (sp.q ?? '').trim().slice(0, 60);
  const items = await listListings({ category, search: q || undefined });

  const tab = (value: string | undefined, label: string) => {
    const params = new URLSearchParams();
    if (value) params.set('cat', value);
    if (q) params.set('q', q);
    const active = (category ?? undefined) === value;
    return (
      <Link key={label} href={`/listings${params.size ? `?${params}` : ''}`} className={active ? 'tab active' : 'tab'} aria-current={active ? 'page' : undefined}>
        {label}
      </Link>
    );
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t.title}</h1>
          <p className="muted">{t.lead}</p>
        </div>
        <Link href="/listings/new" className="btn btn-primary"><Plus size={18} aria-hidden /> {t.add}</Link>
      </header>

      {sp.saved && <p className="notice notice-ok" role="status">{t.saved}</p>}
      {sp.deleted && <p className="notice notice-ok" role="status">{t.deleted}</p>}

      <div className="toolbar">
        <div className="tabs" role="navigation" aria-label={t.filterAria}>
          {tab(undefined, t.all)}
          {CATEGORIES.map((c) => tab(c, catText(d, c).short))}
        </div>
        <form className="search" role="search">
          {category && <input type="hidden" name="cat" value={category} />}
          <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} aria-label={t.searchAria} />
        </form>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>{q || category ? t.noMatchTitle : t.emptyTitle}</h2>
          <p className="muted">{q || category ? t.noMatchText : t.emptyText}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t.colListing}</th>
                <th scope="col">{t.colCategory}</th>
                <th scope="col">{t.colLocation}</th>
                <th scope="col" className="num">{t.colPrice}</th>
                <th scope="col">{t.colStatus}</th>
                <th scope="col"><span className="sr-only">{t.colActions}</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => {
                const ct = catText(d, l.category);
                return (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/listings/${l.id}`} className="row-link">
                        {l.images[0] ? <img src={l.images[0]} alt="" width={56} height={42} /> : <span className="row-noimg" aria-label={t.noPhoto} />}
                        <span>{l.title}{l.featured && <small className="pill pill-accent">{t.featured}</small>}</span>
                      </Link>
                    </td>
                    <td>{ct.short}</td>
                    <td>{l.location || (CATEGORY_CONFIG[l.category].locationRequired ? <span className="warn">{t.notFilled}</span> : <span className="muted">-</span>)}</td>
                    <td className="num"><bdi>{money(locale, l.price)}</bdi><small className="muted"> / {ct.priceUnit}</small></td>
                    <td>{l.published ? <span className="pill pill-ok">{t.shown}</span> : <span className="pill">{t.draft}</span>}</td>
                    <td className="row-actions"><DeleteButton compact kind="listing" name={l.title} action={deleteListingAction.bind(null, l.id)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
