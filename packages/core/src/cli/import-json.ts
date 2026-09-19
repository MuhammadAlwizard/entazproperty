// Loads listings, testimonials and settings from a backup's content.json into an EMPTY database.
// Keeps ids so existing URLs stay the same. Admin accounts and photos are not imported.
//   npm run import-json -w @enjaz/core -- <path to content.json>
import fs from 'node:fs';
import path from 'node:path';
import { closePool, q1, tx } from '../db';
import { migrate } from '../migrations';

const file = process.argv[2];
if (!file || !fs.existsSync(path.resolve(file))) {
  console.error('Pemakaian: npm run import-json -w @enjaz/core -- <path ke content.json>');
  process.exit(1);
}

type Row = Record<string, any>;
const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as { listings: Row[]; testimonials: Row[]; settings: { key: string; value: string }[] };

await migrate();
if (Number((await q1<{ n: number }>('SELECT COUNT(*) AS n FROM listings'))!.n) > 0) {
  console.error('Database sudah berisi listing, impor dibatalkan supaya tidak menimpa data.');
  process.exit(1);
}

const date = (v: unknown) => (v ? new Date(String(v)) : new Date());
const flag = (v: unknown) => (v === true || v === 1 ? 1 : 0);

await tx(async (c) => {
  for (const l of data.listings) {
    await c.execute(
      `INSERT INTO listings (id, category, slug, title, summary, description, price, location, address, maps_url, images, meta, published, featured, sort_order, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [l.id, l.category, l.slug, l.title, l.summary ?? '', l.description ?? '', l.price ?? 0, l.location ?? '', l.address ?? '', l.maps_url ?? '',
        JSON.stringify(l.images ?? []), JSON.stringify(l.meta ?? {}), flag(l.published), flag(l.featured), l.sort_order ?? 0, date(l.created_at), date(l.updated_at)],
    );
  }
  for (const t of data.testimonials) {
    await c.execute(
      'INSERT INTO testimonials (id, name, origin, quote, photo, rating, published, sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [t.id, t.name, t.origin ?? '', t.quote, t.photo ?? '', t.rating ?? 5, flag(t.published), t.sort_order ?? 0],
    );
  }
  for (const s of data.settings) {
    if (s.key === 'heroImage') continue; // replaced by heroImages
    await c.execute('INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [s.key, s.value]);
  }
});
console.log(`Diimpor: ${data.listings.length} listing, ${data.testimonials.length} testimoni, ${data.settings.length} pengaturan.`);
await closePool();
