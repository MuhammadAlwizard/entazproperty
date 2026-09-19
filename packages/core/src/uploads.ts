import { randomUUID } from 'node:crypto';
import { exec, q1 } from './db';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Identify by magic bytes, never by the client-supplied name or MIME type. */
function detectImage(buf: Buffer): { ext: 'jpg' | 'png' | 'webp'; mime: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  return null;
}

/**
 * Removes EXIF (camera model, GPS position!), XMP, Photoshop and comment segments from a JPEG.
 * Photos of villas often carry the exact GPS coordinates of the property. The image data itself
 * is copied byte for byte, so quality is untouched. If the file structure looks wrong we return
 * it unchanged rather than corrupt it.
 */
export function stripJpegMetadata(buf: Buffer): Buffer {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  const parts: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) return buf;
    const marker = buf[i + 1];
    if (marker === 0xff) { i += 1; continue; } // fill byte
    if (marker === 0xda) { parts.push(buf.subarray(i)); return Buffer.concat(parts); } // start of scan: rest is pixels
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { parts.push(buf.subarray(i, i + 2)); i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) return buf;
    const dropIt = marker === 0xe1 || marker === 0xed || marker === 0xfe; // APP1 (EXIF/XMP), APP13, COM
    if (!dropIt) parts.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  return buf;
}

export type SaveResult = { ok: true; url: string } | { ok: false; error: string };

export async function saveImage(input: Buffer): Promise<SaveResult> {
  if (input.length > MAX_UPLOAD_BYTES) return { ok: false, error: 'Ukuran foto maksimal 5 MB.' };
  const kind = detectImage(input);
  if (!kind) return { ok: false, error: 'Format foto harus JPG, PNG, atau WebP.' };
  const bytes = kind.ext === 'jpg' ? stripJpegMetadata(input) : input;
  const id = randomUUID();
  await exec('INSERT INTO uploads (id, ext, mime, bytes, size) VALUES (?,?,?,?,?)', [id, kind.ext, kind.mime, bytes, bytes.length]);
  return { ok: true, url: `/uploads/${id}.${kind.ext}` };
}

const NAME_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/;

export async function readUpload(name: string): Promise<{ id: string; body: Buffer; mime: string } | null> {
  const m = NAME_RE.exec(name); // strict pattern: nothing else ever reaches the query
  if (!m) return null;
  const row = await q1<{ bytes: Buffer; mime: string }>('SELECT bytes, mime FROM uploads WHERE id = ? AND ext = ?', [m[1], m[2]]);
  return row ? { id: m[1], body: Buffer.from(row.bytes), mime: row.mime } : null;
}
