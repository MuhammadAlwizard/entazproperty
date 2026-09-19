'use server';

import { revalidatePath } from 'next/cache';
import {
  MAX_HERO_IMAGES, checkNewPassword, findAdminByEmail, hashPassword, isSafeImage, logAudit, normalizeWhatsapp,
  parseHeroImages, revokeAdminSessions, saveSettings, updateAdminEmail, updateAdminPassword, verifyPassword,
} from '@enjaz/core';
import { getClientIp, requireAdmin } from '@/lib/auth';
import type { FormState } from '@/lib/form';

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const errors: Record<string, string> = {};
  const whatsappLines = String(fd.get('whatsapp') ?? '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const email = s(fd, 'email');
  const instagram = s(fd, 'instagram');
  const address = s(fd, 'address');
  const heroImages = parseHeroImages(fd.getAll('heroImages').filter((v): v is string => typeof v === 'string').join('\n'));
  const heroImagesMobile = parseHeroImages(fd.getAll('heroImagesMobile').filter((v): v is string => typeof v === 'string').join('\n'));

  const badNumber = whatsappLines.find((n) => !/^\+?\d[\d\s-]{7,18}$/.test(n) || normalizeWhatsapp(n).length > 15);
  if (badNumber) errors.whatsapp = `Nomor "${badNumber}" tidak valid. Contoh: +62 812 3456 7890`;
  else if (whatsappLines.length > 5) errors.whatsapp = 'Maksimal 5 nomor.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';
  if (address.length > 300) errors.address = 'Alamat maksimal 300 karakter.';
  if (instagram.length > 60) errors.instagram = 'Maksimal 60 karakter.';
  if (heroImages.length > MAX_HERO_IMAGES) errors.heroImages = `Maksimal ${MAX_HERO_IMAGES} foto hero.`;
  else if (heroImages.some((u) => !isSafeImage(u))) errors.heroImages = 'Ada foto dengan alamat tidak valid.';
  if (heroImagesMobile.length > MAX_HERO_IMAGES) errors.heroImagesMobile = `Maksimal ${MAX_HERO_IMAGES} foto hero untuk HP.`;
  else if (heroImagesMobile.some((u) => !isSafeImage(u))) errors.heroImagesMobile = 'Ada foto dengan alamat tidak valid.';

  if (Object.keys(errors).length) return { errors, formError: 'Ada isian yang perlu diperbaiki.' };
  // Stored one per line, always as +<country code><number>. The first line is the primary contact.
  const whatsapp = [...new Set(whatsappLines.map((n) => `+${normalizeWhatsapp(n)}`))].join('\n');
  await saveSettings({ whatsapp, email, instagram, address, heroImages: heroImages.join('\n'), heroImagesMobile: heroImagesMobile.join('\n') });
  await logAudit({ email: session.email, action: 'settings.update', ip: await getClientIp() });
  return { ok: 'Pengaturan tersimpan. Perubahan langsung tampil di website.' };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin({ allowMustChange: true });
  const ip = await getClientIp();
  const current = String(fd.get('current') ?? '');
  const next = String(fd.get('next') ?? '');
  const confirm = String(fd.get('confirm') ?? '');

  const admin = await findAdminByEmail(session.email);
  if (!admin || !verifyPassword(current, admin.passwordHash)) {
    await logAudit({ email: session.email, action: 'password.change.failed', ip });
    return { errors: { current: 'Password saat ini salah.' } };
  }
  const problem = checkNewPassword(next, admin.email);
  if (problem) return { errors: { next: problem } };
  if (next === current) return { errors: { next: 'Password baru harus berbeda dari yang lama.' } };
  if (next !== confirm) return { errors: { confirm: 'Konfirmasi tidak sama.' } };

  await updateAdminPassword(admin.id, hashPassword(next));
  // Anyone holding an old session (a stolen cookie, a forgotten browser) is signed out now.
  const others = await revokeAdminSessions(admin.id, session.sessionId);
  await logAudit({ email: admin.email, action: 'password.change', detail: { otherSessionsSignedOut: others }, ip });
  revalidatePath('/', 'layout');
  return { ok: others > 0 ? `Password diganti. ${others} perangkat lain otomatis dikeluarkan.` : 'Password diganti.' };
}

export async function changeEmailAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const ip = await getClientIp();
  const password = String(fd.get('password') ?? '');
  const email = s(fd, 'email').toLowerCase();

  const admin = await findAdminByEmail(session.email);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    await logAudit({ email: session.email, action: 'email.change.failed', ip });
    return { errors: { password: 'Password salah.' } };
  }
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errors: { email: 'Format email tidak valid.' } };
  if (email === admin.email) return { errors: { email: 'Email baru sama dengan yang sekarang.' } };
  if (!(await updateAdminEmail(admin.id, email))) return { errors: { email: 'Email itu sudah dipakai admin lain.' } };

  // Anyone holding an old session is signed out; this device keeps working (its session follows the account, not the email).
  const others = await revokeAdminSessions(admin.id, session.sessionId);
  await logAudit({ email, action: 'email.change', detail: { from: admin.email, otherSessionsSignedOut: others }, ip });
  revalidatePath('/', 'layout');
  return { ok: `Email login diganti menjadi ${email}. Pakai email ini untuk masuk berikutnya.` };
}

export async function revokeOtherSessionsAction(): Promise<void> {
  const session = await requireAdmin({ allowMustChange: true });
  const n = await revokeAdminSessions(session.adminId, session.sessionId);
  await logAudit({ email: session.email, action: 'sessions.revoke_others', detail: { count: n }, ip: await getClientIp() });
  revalidatePath('/settings');
}
