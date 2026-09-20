import Link from 'next/link';
import type { Metadata } from 'next';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, countListings } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { catText } from '@/i18n/format';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.dashboard.title };
}

export default async function Dashboard() {
  await requireAdmin();
  const { d } = await getI18n();
  const counts = await countListings();

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{d.dashboard.title}</h1>
          <p className="muted">{d.dashboard.lead}</p>
        </div>
        <Link href="/listings/new" className="btn btn-primary"><Plus size={18} aria-hidden /> {d.dashboard.add}</Link>
      </header>

      {counts.total === 0 ? (
        <div className="empty-state">
          <h2>{d.dashboard.emptyTitle}</h2>
          <p className="muted">{d.dashboard.emptyText}</p>
          <Link href="/listings/new" className="btn btn-primary">{d.dashboard.addFirst}</Link>
        </div>
      ) : (
        <section className="hero-metric" aria-label={d.dashboard.metricAria}>
          <p className="metric-number">{counts.published}</p>
          <div>
            <p className="metric-label">{d.dashboard.metricLabel}</p>
            <p className="muted metric-break">
              {CATEGORIES.map((c) => `${catText(d, c).short} ${counts.byCategory[c]}`).join('   ·   ')}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
