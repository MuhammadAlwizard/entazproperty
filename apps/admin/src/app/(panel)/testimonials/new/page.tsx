import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { TestimonialForm } from '../TestimonialForm';
import { createTestimonialAction } from '../actions';

export const metadata: Metadata = { title: 'Tambah testimoni' };

export default async function NewTestimonial() {
  await requireAdmin();
  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/testimonials" className="back">Kembali ke daftar</Link>
          <h1>Tambah testimoni</h1>
        </div>
      </header>
      <TestimonialForm action={createTestimonialAction} />
    </>
  );
}
