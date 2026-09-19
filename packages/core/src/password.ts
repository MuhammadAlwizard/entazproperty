import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const COMMON = ['password', 'passw0rd', 'admin123', 'qwerty', '123456', 'letmein', 'welcome', 'enjaz', 'iloveyou'];

/** Rules for a NEW admin password. Returns an error message in Indonesian, or null if acceptable. */
export function checkNewPassword(password: string, email: string): string | null {
  if (password.length < 12) return 'Password minimal 12 karakter.';
  if (password.length > 200) return 'Password terlalu panjang.';
  const lower = password.toLowerCase();
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (local.length >= 3 && lower.includes(local)) return 'Password tidak boleh memuat bagian dari email.';
  if (COMMON.some((c) => lower.includes(c))) return 'Password terlalu mudah ditebak.';
  if (new Set(password).size < 6) return 'Password terlalu monoton, pakai lebih banyak variasi karakter.';
  return null;
}
