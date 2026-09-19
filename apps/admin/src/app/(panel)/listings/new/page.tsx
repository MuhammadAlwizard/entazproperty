import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { ListingForm } from '../ListingForm';
import { createListingAction } from '../actions';

export const metadata: Metadata = { title: 'Tambah listing' };

export default async function NewListing() {
  await requireAdmin();
  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/listings" className="back">Kembali ke daftar</Link>
          <h1>Tambah listing</h1>
        </div>
      </header>
      <ListingForm action={createListingAction} />
    </>
  );
}
