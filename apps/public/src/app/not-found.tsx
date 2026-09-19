import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="sec page-head-sec">
      <div className="page-head">
        <h1>Halaman tidak ditemukan</h1>
        <p>Listing yang kamu cari mungkin sudah tidak tersedia atau alamatnya berubah.</p>
        <p><Link href="/" className="text-link">Kembali ke beranda</Link></p>
      </div>
    </section>
  );
}
