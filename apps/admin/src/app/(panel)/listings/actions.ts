'use server';

import { redirect } from 'next/navigation';
import { createListing, deleteListing, getListingById, logAudit, updateListing, validateListing } from '@enjaz/core';
import { getClientIp, requireAdmin } from '@/lib/auth';
import { formToObject, type FormState } from '@/lib/form';

export async function createListingAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const raw = formToObject(fd);
  const result = validateListing(raw);
  if (!result.ok) return { errors: result.errors, values: raw, formError: 'Ada isian yang perlu diperbaiki.' };
  const created = await createListing(result.data);
  await logAudit({ email: session.email, action: 'listing.create', target: created.title, detail: { id: created.id, category: created.category }, ip: await getClientIp() });
  redirect('/listings?saved=1');
}

export async function updateListingAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  if (!(await getListingById(id))) redirect('/listings');
  const raw = formToObject(fd);
  const result = validateListing(raw);
  if (!result.ok) return { errors: result.errors, values: raw, formError: 'Ada isian yang perlu diperbaiki.' };
  await updateListing(id, result.data);
  await logAudit({ email: session.email, action: 'listing.update', target: result.data.title, detail: { id }, ip: await getClientIp() });
  redirect('/listings?saved=1');
}

export async function deleteListingAction(id: number): Promise<void> {
  const session = await requireAdmin();
  const existing = await getListingById(id);
  await deleteListing(id);
  await logAudit({ email: session.email, action: 'listing.delete', target: existing?.title ?? String(id), detail: { id }, ip: await getClientIp() });
  redirect('/listings?deleted=1');
}
