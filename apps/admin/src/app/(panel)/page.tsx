import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Plus } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, CATEGORY_CONFIG, countListings, getSettings, listListings, listTestimonials } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Ringkasan' };

export default async function Dashboard() {
  await requireAdmin();
  const [counts, all, settings, publishedTestimonials] = await Promise.all([
    countListings(), listListings(), getSettings(), listTestimonials({ publishedOnly: true }),
  ]);

  const villasNoLocation = all.filter((l) => l.category === 'villa' && !l.location.trim());
  const noPhoto = all.filter((l) => l.images.length === 0);
  const drafts = all.filter((l) => !l.published);
  const noTestimonials = publishedTestimonials.length === 0;

  const todo: { text: string; href: string }[] = [
    ...villasNoLocation.map((l) => ({ text: `${l.title} belum punya lokasi`, href: `/listings/${l.id}` })),
    ...noPhoto.map((l) => ({ text: `${l.title} belum punya foto`, href: `/listings/${l.id}` })),
    ...drafts.map((l) => ({ text: `${l.title} masih draft dan belum tampil di website`, href: `/listings/${l.id}` })),
    ...(!settings.heroImages.trim() ? [{ text: 'Foto hero beranda belum diisi, bagian atas website masih polos', href: '/settings' }] : []),
    ...(settings.heroImages.trim() && !settings.heroImagesMobile.trim() ? [{ text: 'Foto hero untuk HP belum diisi, di HP foto beranda terpotong kiri dan kanan', href: '/settings' }] : []),
    ...(!settings.whatsapp ? [{ text: 'Nomor WhatsApp belum diisi, tombol pesan belum tampil di website', href: '/settings' }] : []),
    ...(noTestimonials ? [{ text: 'Belum ada testimoni yang tampil', href: '/testimonials' }] : []),
  ];

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

      <section className="block">
        <h2>Perlu dilengkapi</h2>
        {todo.length === 0 ? (
          <p className="muted">Semuanya sudah lengkap. Tidak ada yang perlu diperbaiki.</p>
        ) : (
          <ul className="todo">
            {todo.slice(0, 8).map((t, i) => (
              <li key={i}>
                <Link href={t.href}>
                  <span>{t.text}</span>
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {todo.length > 8 && <p className="muted small">Dan {todo.length - 8} lainnya.</p>}
      </section>
    </>
  );
}
