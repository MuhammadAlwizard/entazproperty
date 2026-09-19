import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListingById } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import { ListingForm } from '../ListingForm';
import { deleteListingAction, updateListingAction } from '../actions';

export const metadata: Metadata = { title: 'Ubah listing' };

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: rawId } = await params;
  const id = Number.parseInt(rawId, 10);
  const listing = Number.isInteger(id) ? await getListingById(id) : null;
  if (!listing) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/listings" className="back">Kembali ke daftar</Link>
          <h1>{listing.title}</h1>
        </div>
      </header>
      <ListingForm listing={listing} action={updateListingAction.bind(null, listing.id)} />
      <div className="danger-zone">
        <DeleteButton what="listing" action={deleteListingAction.bind(null, listing.id)} />
      </div>
    </>
  );
}
