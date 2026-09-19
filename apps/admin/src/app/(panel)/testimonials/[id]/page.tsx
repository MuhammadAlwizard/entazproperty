import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTestimonial } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import { TestimonialForm } from '../TestimonialForm';
import { deleteTestimonialAction, updateTestimonialAction } from '../actions';

export const metadata: Metadata = { title: 'Ubah testimoni' };

export default async function EditTestimonial({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: rawId } = await params;
  const id = Number.parseInt(rawId, 10);
  const item = Number.isInteger(id) ? await getTestimonial(id) : null;
  if (!item) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/testimonials" className="back">Kembali ke daftar</Link>
          <h1>Ubah testimoni</h1>
        </div>
      </header>
      <TestimonialForm item={item} action={updateTestimonialAction.bind(null, item.id)} />
      <div className="danger-zone">
        <DeleteButton what="testimoni" action={deleteTestimonialAction.bind(null, item.id)} />
      </div>
    </>
  );
}
