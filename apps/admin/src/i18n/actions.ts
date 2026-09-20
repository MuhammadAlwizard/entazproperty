'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { LANG_COOKIE, isLocale } from './config';

/** Remembers the panel language for a year. Harmless and safe to call without a session (the login page uses it too). */
export async function setLocale(fd: FormData): Promise<void> {
  const value = fd.get('lang');
  if (!isLocale(value)) return;
  (await cookies()).set(LANG_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
  revalidatePath('/', 'layout');
}
