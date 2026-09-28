// Loads a whole site's content from a backup: listings, testimonials, settings, their English/Arabic translations,
// and the photos, keeping every id so page addresses and photo addresses (/uploads/<id>.<ext>) stay the same.
//
//   npm run import-content -w @enjaz/core -- <content.json> <photo folder> [--replace]
//
// Without --replace the database must have no listings yet. With --replace the current listings, testimonials,
// photos and content settings are deleted first, inside the same transaction (so a failure changes nothing).
// Never touched: admin accounts, sessions, the activity log, bookings and transfer proofs, and the payment
// settings (bank account, payment terms), which belong to the site being imported into.
// Everything is checked before anything is written: every photo the content refers to must be in the folder.
import fs from 'node:fs';
import path from 'node:path';
import { closePool, q1, tx } from '../db';
import { migrate } from '../migrations';

const args = process.argv.slice(2);
const replace = args.includes('--replace');
const [file, photoDir] = args.filter((a) => !a.startsWith('--'));
if (!file || !photoDir || !fs.existsSync(path.resolve(file)) || !fs.existsSync(path.resolve(photoDir))) {
  console.error('Pemakaian: npm run import-content -w @enjaz/core -- <content.json> <folder foto> [--replace]');
  process.exit(1);
}

type Row = Record<string, any>;
const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as {
  listings: Row[]; testimonials: Row[]; settings: { key: string; value: string }[]; uploads?: { id: string; ext: string }[];
};

const KEEP_SETTINGS = ['bankName', 'bankAccount', 'bankHolder', 'paymentTerms'];
const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
// images/meta arrive parsed from the admin backup; an older export may still hold them as JSON text.
const json = (v: unknown, fallback: unknown) => (typeof v === 'string' ? v : JSON.stringify(v ?? fallback));
const text = (v: unknown) => (v == null ? null : typeof v === 'string' ? v : JSON.stringify(v)); // translations: keep as stored
const date = (v: unknown) => (v ? new Date(String(v)) : new Date());
const flag = (v: unknown) => (v === true || v === 1 || v === '1' ? 1 : 0);

/* ---------- 1. Check everything before writing anything ---------- */

const photoFiles = new Map<string, Buffer>();
for (const u of data.uploads ?? []) {
  const name = `${u.id}.${u.ext}`;
  const p = path.join(path.resolve(photoDir), name);
  if (!fs.existsSync(p)) continue; // reported below only if something actually uses it
  photoFiles.set(name, fs.readFileSync(p));
}

// Every /uploads/ address used by the content must be importable.
const used = new Set<string>();
const collect = (s: unknown) => { for (const m of String(s ?? '').matchAll(/\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))/g)) used.add(m[1]); };
for (const l of data.listings) for (const img of (Array.isArray(l.images) ? l.images : [])) collect(img);
for (const t of data.testimonials) collect(t.photo);
for (const s of data.settings) collect(s.value);
const missing = [...used].filter((n) => !photoFiles.has(n));
if (missing.length) {
  console.error(`Dibatalkan: ${missing.length} foto dipakai konten tapi tidak ada di folder foto:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

// Files must really be the image type their name says.
const magicOk = (ext: string, b: Buffer) =>
  ext === 'jpg' ? b[0] === 0xff && b[1] === 0xd8 : ext === 'png' ? b[0] === 0x89 && b[1] === 0x50 : b.subarray(8, 12).toString() === 'WEBP';
const bad = [...photoFiles].filter(([n, b]) => !magicOk(n.split('.')[1], b)).map(([n]) => n);
if (bad.length) {
  console.error(`Dibatalkan: isi file tidak cocok dengan jenisnya: ${bad.join(', ')}`);
  process.exit(1);
}

/* ---------- 2. Write, all or nothing ---------- */

await migrate();
const existing = Number((await q1<{ n: number }>('SELECT COUNT(*) AS n FROM listings'))!.n);
if (existing > 0 && !replace) {
  console.error(`Database sudah berisi ${existing} listing. Tambahkan --replace untuk mengganti isinya (setelah backup).`);
  process.exit(1);
}

await tx(async (c) => {
  if (replace) {
    await c.execute('DELETE FROM listings');
    await c.execute('DELETE FROM testimonials');
    await c.execute('DELETE FROM uploads');
    await c.execute(`DELETE FROM settings WHERE setting_key NOT IN (${KEEP_SETTINGS.map(() => '?').join(',')})`, KEEP_SETTINGS);
  }
  for (const [name, bytes] of photoFiles) {
    const [id, ext] = name.split('.');
    await c.execute('INSERT INTO uploads (id, ext, mime, bytes, size) VALUES (?,?,?,?,?)', [id, ext, MIME[ext], bytes, bytes.length]);
  }
  for (const l of data.listings) {
    await c.execute(
      `INSERT INTO listings (id, category, slug, title, summary, description, price, location, address, maps_url, images, meta, translations,
         published, featured, sort_order, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [l.id, l.category, l.slug, l.title, l.summary ?? '', l.description ?? '', l.price ?? 0, l.location ?? '', l.address ?? '',
        l.maps_url ?? '', json(l.images, []), json(l.meta, {}), text(l.translations), flag(l.published), flag(l.featured), l.sort_order ?? 0,
        date(l.created_at), date(l.updated_at)],
    );
  }
  for (const t of data.testimonials) {
    await c.execute(
      'INSERT INTO testimonials (id, name, origin, quote, photo, translations, rating, published, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      [t.id, t.name, t.origin ?? '', t.quote, t.photo ?? '', text(t.translations), t.rating ?? 5, flag(t.published), t.sort_order ?? 0],
    );
  }
  for (const s of data.settings) {
    if (s.key === 'heroImage' || KEEP_SETTINGS.includes(s.key)) continue; // heroImage: replaced by heroImages long ago
    await c.execute(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [s.key, s.value],
    );
  }
});

console.log(
  `Diimpor: ${data.listings.length} listing, ${data.testimonials.length} testimoni, ${data.settings.length} pengaturan, ${photoFiles.size} foto` +
  (replace ? ' (isi lama diganti).' : '.'),
);
await closePool();
