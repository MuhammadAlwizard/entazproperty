import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListingById } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import { getI18n } from '@/i18n/server';
import { ListingForm } from '../ListingForm';
import { deleteListingAction, updateListingAction } from '../actions';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.listings.editTitle };
}

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { d } = await getI18n();
  const { id: rawId } = await params;
  const id = Number.parseInt(rawId, 10);
  const listing = Number.isInteger(id) ? await getListingById(id) : null;
  if (!listing) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/listings" className="back">{d.common.backToList}</Link>
          <h1>{listing.title}</h1>
        </div>
      </header>
      <ListingForm listing={listing} action={updateListingAction.bind(null, listing.id)} />
      <div className="danger-zone">
        <DeleteButton kind="listing" action={deleteListingAction.bind(null, listing.id)} />
      </div>
    </>
  );
}
