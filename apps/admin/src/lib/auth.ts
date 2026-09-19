import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signToken, verifySignedToken } from '@enjaz/core/session';
import {
  createAdminSession, getAdminSession, logAudit, revokeSessionByToken, type AdminSession,
} from '@enjaz/core';
import { COOKIE } from './cookie';

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET (minimal 32 karakter) harus diisi di environment.');
  return s;
}

async function currentToken(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  return verifySignedToken(value, process.env.SESSION_SECRET);
}

/** Cached per request, so calling it from layout, page and action costs one database lookup. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = await currentToken();
  return token ? getAdminSession(token) : null;
});

/**
 * Every page, server action and route handler must call this itself. The proxy is only a first gate.
 * While the admin still has the first-time password, everything except the password form is locked.
 */
export async function requireAdmin(opts: { allowMustChange?: boolean } = {}): Promise<AdminSession> {
  const s = await getSession();
  if (!s) redirect('/login');
  if (s.mustChangePassword && !opts.allowMustChange) redirect('/settings?wajib=1');
  return s;
}

/** Best effort client address for logs and rate limits. Only trust it behind your host's proxy. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

export async function startSession(admin: { id: number }, ip: string, userAgent: string): Promise<void> {
  const { token, maxAgeSeconds } = await createAdminSession(admin.id, ip, userAgent);
  (await cookies()).set(COOKIE, await signToken(token, secret()), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

/** Revokes the session in the database (a copied cookie stops working) and clears the cookie. */
export async function endSession(): Promise<void> {
  const token = await currentToken();
  if (token) {
    const s = await getAdminSession(token);
    await revokeSessionByToken(token);
    if (s) await logAudit({ email: s.email, action: 'logout', ip: await getClientIp() });
  }
  // A __Host- cookie can only be overwritten with the same attributes (Secure, Path=/), so expire it
  // explicitly. A plain delete() is ignored by the browser and leaves a stale cookie behind.
  (await cookies()).set(COOKIE, '', {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0,
  });
}
