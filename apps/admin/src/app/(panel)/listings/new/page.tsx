import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { ListingForm } from '../ListingForm';
import { createListingAction } from '../actions';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.listings.newTitle };
}

export default async function NewListing() {
  await requireAdmin();
  const { d } = await getI18n();
  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/listings" className="back">{d.common.backToList}</Link>
          <h1>{d.listings.newTitle}</h1>
        </div>
      </header>
      <ListingForm action={createListingAction} />
    </>
  );
}
