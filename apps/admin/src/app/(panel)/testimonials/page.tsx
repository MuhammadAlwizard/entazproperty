import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Star } from '@phosphor-icons/react/dist/ssr';
import { listTestimonials } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Testimoni' };

export default async function Testimonials({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const items = await listTestimonials();

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Testimoni</h1>
          <p className="muted">Tampil di bagian bawah beranda, di bawah empat layanan.</p>
        </div>
        <Link href="/testimonials/new" className="btn btn-primary"><Plus size={18} aria-hidden /> Tambah testimoni</Link>
      </header>

      {sp.saved && <p className="notice notice-ok" role="status">Testimoni tersimpan.</p>}
      {sp.deleted && <p className="notice notice-ok" role="status">Testimoni dihapus.</p>}

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>Belum ada testimoni</h2>
          <p className="muted">Tambahkan testimoni dari pelanggan yang sudah pernah menyewa.</p>
        </div>
      ) : (
        <ul className="quote-list">
          {items.map((t) => (
            <li key={t.id}>
              <Link href={`/testimonials/${t.id}`}>
                <div className="quote-top">
                  {t.photo ? <img className="avatar" src={t.photo} alt="" width={36} height={36} /> : <span className="avatar avatar-initial" aria-hidden>{t.name.trim().charAt(0).toUpperCase()}</span>}
                  <strong>{t.name}</strong>
                  <span className="stars-inline" aria-label={`${t.rating} dari 5`}>
                    {Array.from({ length: t.rating }, (_, i) => <Star key={i} size={14} weight="fill" aria-hidden />)}
                  </span>
                  {t.published ? <span className="pill pill-ok">Tampil</span> : <span className="pill">Draft</span>}
                </div>
                {t.origin && <p className="muted small">{t.origin}</p>}
                <p className="quote-text">{t.quote}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
