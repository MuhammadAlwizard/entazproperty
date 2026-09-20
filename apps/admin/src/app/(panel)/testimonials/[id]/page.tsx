import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTestimonial } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import { getI18n } from '@/i18n/server';
import { TestimonialForm } from '../TestimonialForm';
import { deleteTestimonialAction, updateTestimonialAction } from '../actions';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.testimonials.editTitle };
}

export default async function EditTestimonial({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { d } = await getI18n();
  const { id: rawId } = await params;
  const id = Number.parseInt(rawId, 10);
  const item = Number.isInteger(id) ? await getTestimonial(id) : null;
  if (!item) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/testimonials" className="back">{d.common.backToList}</Link>
          <h1>{d.testimonials.editTitle}</h1>
        </div>
      </header>
      <TestimonialForm item={item} action={updateTestimonialAction.bind(null, item.id)} />
      <div className="danger-zone">
        <DeleteButton kind="testimonial" action={deleteTestimonialAction.bind(null, item.id)} />
      </div>
    </>
  );
}
