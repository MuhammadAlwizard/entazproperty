'use server';

import { revalidatePath } from 'next/cache';
import {
  MAX_HERO_IMAGES, checkNewPassword, findAdminByEmail, hashPassword, isSafeImage, logAudit, normalizeWhatsapp,
  parseHeroImages, revokeAdminSessions, saveSettings, updateAdminEmail, updateAdminPassword, verifyPassword,
} from '@enjaz/core';
import { getClientIp, requireAdmin } from '@/lib/auth';
import type { FormState } from '@/lib/form';
import { getDict } from '@/i18n/server';
import { fill } from '@/i18n/format';

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const e = d.settings.errors;
  const errors: Record<string, string> = {};
  const whatsappLines = String(fd.get('whatsapp') ?? '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const email = s(fd, 'email');
  const instagram = s(fd, 'instagram');
  const address = s(fd, 'address');
  const mapsUrl = s(fd, 'mapsUrl');
  const heroImages = parseHeroImages(fd.getAll('heroImages').filter((v): v is string => typeof v === 'string').join('\n'));
  const heroImagesMobile = parseHeroImages(fd.getAll('heroImagesMobile').filter((v): v is string => typeof v === 'string').join('\n'));

  const badNumber = whatsappLines.find((n) => !/^\+?\d[\d\s-]{7,18}$/.test(n) || normalizeWhatsapp(n).length > 15);
  if (badNumber) errors.whatsapp = fill(e.whatsappBad, { n: badNumber });
  else if (whatsappLines.length > 5) errors.whatsapp = e.whatsappMax;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = e.emailBad;
  if (address.length > 300) errors.address = e.addressMax;
  if (mapsUrl && !/^https:\/\/[^\s]+$/.test(mapsUrl)) errors.mapsUrl = e.mapsHttps;
  else if (mapsUrl.length > 500) errors.mapsUrl = e.mapsLong;
  if (instagram.length > 60) errors.instagram = e.instagramMax;
  if (heroImages.length > MAX_HERO_IMAGES) errors.heroImages = fill(e.heroMax, { max: MAX_HERO_IMAGES });
  else if (heroImages.some((u) => !isSafeImage(u))) errors.heroImages = e.heroBad;
  if (heroImagesMobile.length > MAX_HERO_IMAGES) errors.heroImagesMobile = fill(e.heroMobileMax, { max: MAX_HERO_IMAGES });
  else if (heroImagesMobile.some((u) => !isSafeImage(u))) errors.heroImagesMobile = e.heroBad;

  if (Object.keys(errors).length) return { errors, formError: d.common.formError };
  // Stored one per line, always as +<country code><number>. The first line is the primary contact.
  const whatsapp = [...new Set(whatsappLines.map((n) => `+${normalizeWhatsapp(n)}`))].join('\n');
  await saveSettings({ whatsapp, email, instagram, address, mapsUrl, heroImages: heroImages.join('\n'), heroImagesMobile: heroImagesMobile.join('\n') });
  await logAudit({ email: session.email, action: 'settings.update', ip: await getClientIp() });
  return { ok: d.settings.saved };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin({ allowMustChange: true });
  const d = await getDict();
  const t = d.settings.password;
  const ip = await getClientIp();
  const current = String(fd.get('current') ?? '');
  const next = String(fd.get('next') ?? '');
  const confirm = String(fd.get('confirm') ?? '');

  const admin = await findAdminByEmail(session.email);
  if (!admin || !verifyPassword(current, admin.passwordHash)) {
    await logAudit({ email: session.email, action: 'password.change.failed', ip });
    return { errors: { current: t.wrongCurrent } };
  }
  const problem = checkNewPassword(next, admin.email, d.password);
  if (problem) return { errors: { next: problem } };
  if (next === current) return { errors: { next: t.same } };
  if (next !== confirm) return { errors: { confirm: t.mismatch } };

  await updateAdminPassword(admin.id, hashPassword(next));
  // Anyone holding an old session (a stolen cookie, a forgotten browser) is signed out now.
  const others = await revokeAdminSessions(admin.id, session.sessionId);
  await logAudit({ email: admin.email, action: 'password.change', detail: { otherSessionsSignedOut: others }, ip });
  revalidatePath('/', 'layout');
  return { ok: others > 0 ? fill(t.changedOthers, { n: others }) : t.changed };
}

export async function changeEmailAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const d = await getDict();
  const t = d.settings.email;
  const ip = await getClientIp();
  const password = String(fd.get('password') ?? '');
  const email = s(fd, 'email').toLowerCase();

  const admin = await findAdminByEmail(session.email);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    await logAudit({ email: session.email, action: 'email.change.failed', ip });
    return { errors: { password: t.wrongPassword } };
  }
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errors: { email: t.bad } };
  if (email === admin.email) return { errors: { email: t.same } };
  if (!(await updateAdminEmail(admin.id, email))) return { errors: { email: t.taken } };

  // Anyone holding an old session is signed out; this device keeps working (its session follows the account, not the email).
  const others = await revokeAdminSessions(admin.id, session.sessionId);
  await logAudit({ email, action: 'email.change', detail: { from: admin.email, otherSessionsSignedOut: others }, ip });
  revalidatePath('/', 'layout');
  return { ok: fill(t.changed, { email }) };
}

export async function revokeOtherSessionsAction(): Promise<void> {
  const session = await requireAdmin({ allowMustChange: true });
  const n = await revokeAdminSessions(session.adminId, session.sessionId);
  await logAudit({ email: session.email, action: 'sessions.revoke_others', detail: { count: n }, ip: await getClientIp() });
  revalidatePath('/settings');
}
