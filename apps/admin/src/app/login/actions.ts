'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  clearLoginFailures, findAdminByEmail, hashPassword, isLoginBlocked, logAudit, recordLoginFailure, verifyPassword,
} from '@enjaz/core';
import { endSession, getClientIp, startSession } from '@/lib/auth';
import { getDict } from '@/i18n/server';

export type LoginState = { error?: string };

// Verified against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = hashPassword('not-a-real-password');

export async function login(_prev: LoginState | undefined, fd: FormData): Promise<LoginState> {
  const d = await getDict();
  const email = String(fd.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(fd.get('password') ?? '').slice(0, 300);
  if (!email || !password) return { error: d.login.fillBoth };

  const ip = await getClientIp();
  const userAgent = (await headers()).get('user-agent') ?? '';
  // Two counters: per address and per account. The account counter still works if an attacker fakes addresses.
  const keys = [`ip:${ip}`, `email:${email}`];

  if (await isLoginBlocked(keys)) {
    await logAudit({ email, action: 'login.blocked', ip });
    return { error: d.login.blocked };
  }

  const admin = await findAdminByEmail(email);
  const ok = admin ? verifyPassword(password, admin.passwordHash) : (verifyPassword(password, DUMMY_HASH), false);
  if (!ok || !admin) {
    await recordLoginFailure(keys);
    await logAudit({ email, action: 'login.failed', ip });
    return { error: d.login.wrong };
  }

  await clearLoginFailures(keys);
  await startSession(admin, ip, userAgent);
  await logAudit({ email: admin.email, action: 'login.success', ip });
  redirect('/');
}

export async function logout(): Promise<void> {
  await endSession();
  redirect('/login');
}
