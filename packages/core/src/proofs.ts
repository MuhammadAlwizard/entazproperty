import { randomUUID } from 'node:crypto';
import { exec, q, q1 } from './db';
import { stripJpegMetadata } from './uploads';

// Transfer proofs: screenshots or PDF receipts a customer uploads from their booking page.
// Identified by magic bytes, never by the name or type the browser claims.

export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
/** Per booking, counting rejected ones, so a page cannot be used to fill the database. */
export const MAX_PROOFS_PER_BOOKING = 5;

export type ProofReview = 'new' | 'accepted' | 'rejected';
export type ProofInfo = { id: string; ext: string; size: number; review: ProofReview; rejectReason: string; createdAt: string };

export type ProofMessages = { tooLarge: string; badFormat: string; tooMany: string; closed: string };
export const PROOF_ID: ProofMessages = {
  tooLarge: 'Ukuran file maksimal 5 MB.',
  badFormat: 'File harus foto (JPG, PNG, WebP) atau PDF.',
  tooMany: 'Batas unggahan untuk booking ini sudah habis. Kirim buktinya lewat WhatsApp.',
  closed: 'Booking ini tidak sedang menunggu pembayaran.',
};

function detectProof(buf: Buffer): { ext: 'jpg' | 'png' | 'webp' | 'pdf'; mime: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (buf.length > 8 && buf.subarray(0, 5).toString() === '%PDF-') return { ext: 'pdf', mime: 'application/pdf' };
  return null;
}

export async function saveProof(bookingId: number, input: Buffer, ip: string, m: ProofMessages = PROOF_ID): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.length > MAX_PROOF_BYTES) return { ok: false, error: m.tooLarge };
  const kind = detectProof(input);
  if (!kind) return { ok: false, error: m.badFormat };
  const count = await q1<{ n: number }>('SELECT COUNT(*) AS n FROM payment_proofs WHERE booking_id = ?', [bookingId]);
  if (Number(count?.n ?? 0) >= MAX_PROOFS_PER_BOOKING) return { ok: false, error: m.tooMany };
  const bytes = kind.ext === 'jpg' ? stripJpegMetadata(input) : input;
  await exec('INSERT INTO payment_proofs (id, booking_id, ext, mime, bytes, size, ip) VALUES (?,?,?,?,?,?,?)', [
    randomUUID(), bookingId, kind.ext, kind.mime, bytes, bytes.length, ip.slice(0, 64),
  ]);
  return { ok: true };
}

/** Oldest first. Metadata only, the file itself is read with readProof. */
export async function listProofs(bookingId: number): Promise<ProofInfo[]> {
  const rows = await q<{ id: string; ext: string; size: number; review: ProofReview; reject_reason: string; created_at: Date }>(
    'SELECT id, ext, size, review, reject_reason, created_at FROM payment_proofs WHERE booking_id = ? ORDER BY created_at ASC',
    [bookingId],
  );
  return rows.map((r) => ({ id: r.id, ext: r.ext, size: r.size, review: r.review, rejectReason: r.reject_reason, createdAt: new Date(r.created_at).toISOString() }));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** For the admin panel only: the public site never serves proofs back. */
export async function readProof(id: string): Promise<{ body: Buffer; mime: string; ext: string; bookingId: number } | null> {
  if (!UUID_RE.test(id)) return null;
  const r = await q1<{ bytes: Buffer; mime: string; ext: string; booking_id: number }>('SELECT bytes, mime, ext, booking_id FROM payment_proofs WHERE id = ?', [id]);
  return r ? { body: Buffer.from(r.bytes), mime: r.mime, ext: r.ext, bookingId: r.booking_id } : null;
}

/** Marks every proof still waiting on this booking as accepted or rejected. Returns how many changed. */
export async function reviewNewProofs(bookingId: number, review: 'accepted' | 'rejected', reason = ''): Promise<number> {
  const res = await exec(
    "UPDATE payment_proofs SET review = ?, reject_reason = ?, reviewed_at = ? WHERE booking_id = ? AND review = 'new'",
    [review, reason.slice(0, 300), new Date(), bookingId],
  );
  return res.affectedRows;
}
