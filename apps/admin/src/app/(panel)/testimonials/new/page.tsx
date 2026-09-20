import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { TestimonialForm } from '../TestimonialForm';
import { createTestimonialAction } from '../actions';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.testimonials.newTitle };
}

export default async function NewTestimonial() {
  await requireAdmin();
  const { d } = await getI18n();
  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/testimonials" className="back">{d.common.backToList}</Link>
          <h1>{d.testimonials.newTitle}</h1>
        </div>
      </header>
      <TestimonialForm action={createTestimonialAction} />
    </>
  );
}
