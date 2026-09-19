import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { exec, parseJson, q, q1 } from './db';

// Every time window below is computed from the application clock (a JS Date) and sent as a value,
// so nothing depends on the database server's clock or on MySQL/MariaDB date functions.

/* ---------------------------- Admin sessions ---------------------------- */
// The browser cookie carries a random 256-bit token. Only its SHA-256 is stored, so a leaked
// database does not leak usable sessions. Every session can be revoked server-side.

export const SESSION_ABSOLUTE_HOURS = 8;
export const SESSION_IDLE_MINUTES = 45;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

export type AdminSession = { sessionId: string; adminId: number; email: string; mustChangePassword: boolean };

export async function createAdminSession(adminId: number, ip: string, userAgent: string): Promise<{ token: string; maxAgeSeconds: number }> {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  await exec(
    'INSERT INTO admin_sessions (id, token_hash, admin_id, last_seen_at, expires_at, ip, user_agent) VALUES (?,?,?,?,?,?,?)',
    [randomUUID(), sha256(token), adminId, now, new Date(now.getTime() + SESSION_ABSOLUTE_HOURS * 3600_000), ip.slice(0, 64), userAgent.slice(0, 200)],
  );
  // housekeeping: old rows are useless
  const weekAgo = minutesAgo(7 * 24 * 60);
  await exec('DELETE FROM admin_sessions WHERE expires_at < ? OR revoked_at < ?', [weekAgo, weekAgo]);
  return { token, maxAgeSeconds: SESSION_ABSOLUTE_HOURS * 3600 };
}

/** Valid = not revoked, not past its absolute expiry, and used within the idle window. Also refreshes last-seen. */
export async function getAdminSession(token: string): Promise<AdminSession | null> {
  const r = await q1<{ id: string; admin_id: number; email: string; must_change_password: number }>(
    `SELECT s.id, a.id AS admin_id, a.email, a.must_change_password
       FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND s.last_seen_at > ?
      LIMIT 1`,
    [sha256(token), new Date(), minutesAgo(SESSION_IDLE_MINUTES)],
  );
  if (!r) return null;
  await exec('UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?', [new Date(), r.id]);
  return { sessionId: r.id, adminId: r.admin_id, email: r.email, mustChangePassword: r.must_change_password === 1 };
}

export async function revokeSessionByToken(token: string): Promise<void> {
  await exec('UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL', [new Date(), sha256(token)]);
}

/** Sign out every device of this admin, optionally keeping the current one. Returns how many were signed out. */
export async function revokeAdminSessions(adminId: number, keepSessionId?: string): Promise<number> {
  const res = keepSessionId
    ? await exec('UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL AND id <> ?', [new Date(), adminId, keepSessionId])
    : await exec('UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL', [new Date(), adminId]);
  return res.affectedRows;
}

export type SessionInfo = { id: string; createdAt: string; lastSeenAt: string; ip: string; userAgent: string; current: boolean };

export async function listAdminSessions(adminId: number, currentSessionId: string): Promise<SessionInfo[]> {
  const rows = await q<{ id: string; created_at: Date; last_seen_at: Date; ip: string; user_agent: string }>(
    `SELECT id, created_at, last_seen_at, ip, user_agent FROM admin_sessions
      WHERE admin_id = ? AND revoked_at IS NULL AND expires_at > ? AND last_seen_at > ?
      ORDER BY last_seen_at DESC`,
    [adminId, new Date(), minutesAgo(SESSION_IDLE_MINUTES)],
  );
  return rows.map((r) => ({
    id: r.id, createdAt: new Date(r.created_at).toISOString(), lastSeenAt: new Date(r.last_seen_at).toISOString(),
    ip: r.ip, userAgent: r.user_agent, current: r.id === currentSessionId,
  }));
}

/* ------------------------- Login attempt limiting ------------------------- */
// Stored in the database (not memory) so limits survive restarts and work with several instances.

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 10;

export async function isLoginBlocked(keys: string[]): Promise<boolean> {
  if (!keys.length) return false;
  const marks = keys.map(() => '?').join(',');
  const r = await q1<{ one: number }>(
    `SELECT 1 AS one FROM login_attempts WHERE attempt_key IN (${marks}) AND fail_count >= ? AND first_at > ? LIMIT 1`,
    [...keys, LOGIN_MAX_ATTEMPTS, minutesAgo(LOGIN_WINDOW_MINUTES)],
  );
  return r !== null;
}

export async function recordLoginFailure(keys: string[]): Promise<void> {
  const now = new Date();
  const windowStart = minutesAgo(LOGIN_WINDOW_MINUTES);
  for (const key of keys) {
    // Assignments run left to right: fail_count is decided using the OLD first_at, then first_at is reset.
    await exec(
      `INSERT INTO login_attempts (attempt_key, fail_count, first_at) VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         fail_count = IF(first_at < ?, 1, fail_count + 1),
         first_at = IF(first_at < ?, ?, first_at)`,
      [key.slice(0, 220), now, windowStart, windowStart, now],
    );
  }
}

export async function clearLoginFailures(keys: string[]): Promise<void> {
  if (!keys.length) return;
  await exec(`DELETE FROM login_attempts WHERE attempt_key IN (${keys.map(() => '?').join(',')})`, keys);
}

/* -------------------------------- Audit log -------------------------------- */

export type AuditEntry = { email: string; action: string; target?: string; detail?: Record<string, unknown>; ip?: string };

/** Never throws: a logging problem must not break the action being logged. */
export async function logAudit(e: AuditEntry): Promise<void> {
  try {
    await exec('INSERT INTO audit_log (admin_email, action, target, detail, ip) VALUES (?,?,?,?,?)', [
      e.email.slice(0, 200), e.action.slice(0, 60), (e.target ?? '').slice(0, 300), JSON.stringify(e.detail ?? {}), (e.ip ?? '').slice(0, 64),
    ]);
  } catch (err) {
    console.error('[audit] failed to write log:', (err as Error).message);
  }
}

export type AuditRow = { id: number; at: string; email: string; action: string; target: string; detail: Record<string, unknown>; ip: string };

export async function listAudit(limit = 100): Promise<AuditRow[]> {
  const rows = await q<{ id: number; created_at: Date; admin_email: string; action: string; target: string; detail: string; ip: string }>(
    `SELECT id, created_at, admin_email, action, target, detail, ip FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ${Math.max(1, Math.trunc(limit))}`,
  );
  return rows.map((r) => ({
    id: Number(r.id), at: new Date(r.created_at).toISOString(), email: r.admin_email, action: r.action,
    target: r.target, detail: parseJson<Record<string, unknown>>(r.detail, {}), ip: r.ip,
  }));
}

/* --------------------------------- Backup --------------------------------- */

/** Everything an owner needs to rebuild the site content. Password hashes and session tokens are never included. */
export async function exportContent(): Promise<Record<string, unknown>> {
  const [listings, testimonials, settings, admins, uploads] = await Promise.all([
    q<Record<string, unknown>>('SELECT * FROM listings ORDER BY id'),
    q<Record<string, unknown>>('SELECT * FROM testimonials ORDER BY id'),
    q<Record<string, unknown>>('SELECT setting_key AS `key`, setting_value AS `value` FROM settings ORDER BY setting_key'),
    q<Record<string, unknown>>('SELECT id, email, created_at FROM admins ORDER BY id'),
    q<Record<string, unknown>>('SELECT id, ext, mime, size, created_at FROM uploads ORDER BY created_at'),
  ]);
  const parsed = listings.map((l) => ({ ...l, images: parseJson(l.images, []), meta: parseJson(l.meta, {}) }));
  return {
    exportedAt: new Date().toISOString(),
    note: 'Foto tidak ikut di file ini (hanya daftar id). Password tidak pernah diekspor.',
    listings: parsed, testimonials, settings, admins, uploads,
  };
}
