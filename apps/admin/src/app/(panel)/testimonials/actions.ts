'use server';

import { redirect } from 'next/navigation';
import {
  createTestimonial, deleteTestimonial, getTestimonial, logAudit, updateTestimonial, validateTestimonial,
} from '@enjaz/core';
import { getClientIp, requireAdmin } from '@/lib/auth';
import { formToObject, type FormState } from '@/lib/form';
import { getDict } from '@/i18n/server';

export async function createTestimonialAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const raw = formToObject(fd);
  const result = validateTestimonial(raw, { messages: d.validation });
  if (!result.ok) return { errors: result.errors, values: raw, formError: d.common.formError };
  await createTestimonial(result.data);
  await logAudit({ email: session.email, action: 'testimonial.create', target: result.data.name, ip: await getClientIp() });
  redirect('/testimonials?saved=1');
}

export async function updateTestimonialAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  if (!(await getTestimonial(id))) redirect('/testimonials');
  const raw = formToObject(fd);
  const result = validateTestimonial(raw, { messages: d.validation });
  if (!result.ok) return { errors: result.errors, values: raw, formError: d.common.formError };
  await updateTestimonial(id, result.data);
  await logAudit({ email: session.email, action: 'testimonial.update', target: result.data.name, detail: { id }, ip: await getClientIp() });
  redirect('/testimonials?saved=1');
}

export async function deleteTestimonialAction(id: number): Promise<void> {
  const session = await requireAdmin();
  const existing = await getTestimonial(id);
  await deleteTestimonial(id);
  await logAudit({ email: session.email, action: 'testimonial.delete', target: existing?.name ?? String(id), detail: { id }, ip: await getClientIp() });
  redirect('/testimonials?deleted=1');
}
