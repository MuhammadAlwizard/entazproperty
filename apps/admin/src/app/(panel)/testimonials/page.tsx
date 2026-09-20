import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Star } from '@phosphor-icons/react/dist/ssr';
import { listTestimonials } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { fill } from '@/i18n/format';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.testimonials.title };
}

export default async function Testimonials({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  await requireAdmin();
  const { d } = await getI18n();
  const t = d.testimonials;
  const sp = await searchParams;
  const items = await listTestimonials();

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t.title}</h1>
          <p className="muted">{t.lead}</p>
        </div>
        <Link href="/testimonials/new" className="btn btn-primary"><Plus size={18} aria-hidden /> {t.add}</Link>
      </header>

      {sp.saved && <p className="notice notice-ok" role="status">{t.saved}</p>}
      {sp.deleted && <p className="notice notice-ok" role="status">{t.deleted}</p>}

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>{t.emptyTitle}</h2>
          <p className="muted">{t.emptyText}</p>
        </div>
      ) : (
        <ul className="quote-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/testimonials/${item.id}`}>
                <div className="quote-top">
                  {item.photo ? <img className="avatar" src={item.photo} alt="" width={36} height={36} /> : <span className="avatar avatar-initial" aria-hidden>{item.name.trim().charAt(0).toUpperCase()}</span>}
                  <strong>{item.name}</strong>
                  <span className="stars-inline" aria-label={fill(t.stars, { n: item.rating })}>
                    {Array.from({ length: item.rating }, (_, i) => <Star key={i} size={14} weight="fill" aria-hidden />)}
                  </span>
                  {item.published ? <span className="pill pill-ok">{t.shown}</span> : <span className="pill">{t.draft}</span>}
                </div>
                {item.origin && <p className="muted small">{item.origin}</p>}
                <p className="quote-text">{item.quote}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
