import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { CATEGORIES, CATEGORY_CONFIG, formatRupiah, isCategory, listListings } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import { deleteListingAction } from './actions';

export const metadata: Metadata = { title: 'Listing' };

type SP = Promise<{ cat?: string; q?: string; saved?: string; deleted?: string }>;

export default async function Listings({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
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
          <h1>Listing</h1>
          <p className="muted">Villa, mobil, motor, dan paket tour yang tampil di website.</p>
        </div>
        <Link href="/listings/new" className="btn btn-primary"><Plus size={18} aria-hidden /> Tambah listing</Link>
      </header>

      {sp.saved && <p className="notice notice-ok" role="status">Listing tersimpan. Perubahan langsung tampil di website.</p>}
      {sp.deleted && <p className="notice notice-ok" role="status">Listing dihapus.</p>}

      <div className="toolbar">
        <div className="tabs" role="navigation" aria-label="Filter kategori">
          {tab(undefined, 'Semua')}
          {CATEGORIES.map((c) => tab(c, CATEGORY_CONFIG[c].short))}
        </div>
        <form className="search" role="search">
          {category && <input type="hidden" name="cat" value={category} />}
          <input name="q" defaultValue={q} placeholder="Cari nama atau lokasi" aria-label="Cari listing" />
        </form>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>{q || category ? 'Tidak ada listing yang cocok' : 'Belum ada listing'}</h2>
          <p className="muted">{q || category ? 'Coba kata kunci atau kategori lain.' : 'Tambahkan listing pertama supaya tampil di website.'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Listing</th>
                <th scope="col">Kategori</th>
                <th scope="col">Lokasi</th>
                <th scope="col" className="num">Harga</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/listings/${l.id}`} className="row-link">
                      {l.images[0] ? <img src={l.images[0]} alt="" width={56} height={42} /> : <span className="row-noimg" aria-label="Belum ada foto" />}
                      <span>{l.title}{l.featured && <small className="pill pill-accent">Unggulan</small>}</span>
                    </Link>
                  </td>
                  <td>{CATEGORY_CONFIG[l.category].short}</td>
                  <td>{l.location || (CATEGORY_CONFIG[l.category].locationRequired ? <span className="warn">Belum diisi</span> : <span className="muted">-</span>)}</td>
                  <td className="num">{formatRupiah(l.price)}<small className="muted"> / {CATEGORY_CONFIG[l.category].priceUnit}</small></td>
                  <td>{l.published ? <span className="pill pill-ok">Tampil</span> : <span className="pill">Draft</span>}</td>
                  <td className="row-actions"><DeleteButton compact what={`listing ${l.title}`} action={deleteListingAction.bind(null, l.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
