'use server';

import { redirect } from 'next/navigation';
import { createListing, deleteListing, getListingById, logAudit, updateListing, validateListing } from '@enjaz/core';
import { getClientIp, requireAdmin } from '@/lib/auth';
import { formToObject, type FormState } from '@/lib/form';
import { getDict } from '@/i18n/server';
import { catText } from '@/i18n/format';
import type { Dict } from '@/i18n/dictionaries';

/** Validation wording in the panel language, including the translated field labels. */
const wording = (d: Dict) => ({
  messages: d.validation,
  fieldLabel: (category: Parameters<typeof catText>[1], key: string) => catText(d, category).fields[key]?.label ?? key,
  locationLabel: (category: Parameters<typeof catText>[1]) => catText(d, category).locationLabel,
});

export async function createListingAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const raw = formToObject(fd);
  const result = validateListing(raw, wording(d));
  if (!result.ok) return { errors: result.errors, values: raw, formError: d.common.formError };
  const created = await createListing(result.data);
  await logAudit({ email: session.email, action: 'listing.create', target: created.title, detail: { id: created.id, category: created.category }, ip: await getClientIp() });
  redirect('/listings?saved=1');
}

export async function updateListingAction(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  if (!(await getListingById(id))) redirect('/listings');
  const raw = formToObject(fd);
  const result = validateListing(raw, wording(d));
  if (!result.ok) return { errors: result.errors, values: raw, formError: d.common.formError };
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
