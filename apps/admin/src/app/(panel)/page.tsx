import Link from 'next/link';
import type { Metadata } from 'next';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, CATEGORY_CONFIG, countListings } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Ringkasan' };

export default async function Dashboard() {
  await requireAdmin();
  const counts = await countListings();

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Ringkasan</h1>
          <p className="muted">Apa yang sedang tampil di website hari ini.</p>
        </div>
        <Link href="/listings/new" className="btn btn-primary"><Plus size={18} aria-hidden /> Tambah listing</Link>
      </header>

      {counts.total === 0 ? (
        <div className="empty-state">
          <h2>Belum ada listing</h2>
          <p className="muted">Mulai dengan menambahkan villa, mobil, motor, atau paket tour pertama.</p>
          <Link href="/listings/new" className="btn btn-primary">Tambah listing pertama</Link>
        </div>
      ) : (
        <section className="hero-metric" aria-label="Jumlah listing tayang">
          <p className="metric-number">{counts.published}</p>
          <div>
            <p className="metric-label">listing tampil di website</p>
            <p className="muted metric-break">
              {CATEGORIES.map((c) => `${CATEGORY_CONFIG[c].short} ${counts.byCategory[c]}`).join('   ·   ')}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
