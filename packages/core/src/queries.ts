import { exec, isDuplicateError, parseJson, q, q1, tx } from './db';
import { slugify } from './format';
import type { Category } from './categories';
import {
  SETTING_KEYS,
  type Listing,
  type ListingInput,
  type ListingTranslations,
  type TestimonialTranslations,
  type Settings,
  type Testimonial,
  type TestimonialInput,
} from './types';

/* ------------------------------ Listings ------------------------------ */

type ListingRow = {
  id: number; category: Category; slug: string; title: string; summary: string; description: string;
  price: number; location: string; address: string; maps_url: string; images: string; meta: string; translations: string | null;
  published: number; featured: number; sort_order: number; created_at: Date; updated_at: Date;
};

function toListing(r: ListingRow): Listing {
  const images = parseJson<unknown>(r.images, []);
  return {
    id: r.id, category: r.category, slug: r.slug, title: r.title, summary: r.summary,
    description: r.description, price: r.price, location: r.location, address: r.address,
    mapsUrl: r.maps_url, images: Array.isArray(images) ? (images as string[]) : [],
    meta: parseJson<Record<string, string>>(r.meta, {}),
    translations: parseJson<ListingTranslations>(r.translations, {}),
    published: r.published === 1, featured: r.featured === 1, sortOrder: r.sort_order,
    createdAt: new Date(r.created_at).toISOString(), updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export type ListingFilter = { category?: Category; publishedOnly?: boolean; search?: string; limit?: number };

export async function listListings(f: ListingFilter = {}): Promise<Listing[]> {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.category) { where.push('category = ?'); args.push(f.category); }
  if (f.publishedOnly) where.push('published = 1');
  if (f.search) {
    const like = `%${f.search.replace(/[\\%_]/g, '')}%`;
    where.push('(title LIKE ? OR location LIKE ?)'); // the column collation is case-insensitive
    args.push(like, like);
  }
  // LIMIT is a validated integer written into the SQL: prepared-statement placeholders are not allowed there on newer MySQL.
  const limit = f.limit ? ` LIMIT ${Math.max(1, Math.trunc(f.limit))}` : '';
  const sql = `SELECT * FROM listings ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY featured DESC, sort_order ASC, id DESC${limit}`;
  return (await q<ListingRow>(sql, args)).map(toListing);
}

export async function getListingById(id: number): Promise<Listing | null> {
  const r = await q1<ListingRow>('SELECT * FROM listings WHERE id = ?', [id]);
  return r ? toListing(r) : null;
}

export async function getListingBySlug(category: Category, slug: string, publishedOnly = true): Promise<Listing | null> {
  const r = await q1<ListingRow>(
    `SELECT * FROM listings WHERE category = ? AND slug = ? ${publishedOnly ? 'AND published = 1' : ''}`,
    [category, slug],
  );
  return r ? toListing(r) : null;
}

export async function createListing(input: ListingInput): Promise<Listing> {
  const base = slugify(input.title);
  for (let i = 1; i <= 25; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    try {
      const res = await exec(
        `INSERT INTO listings (category, slug, title, summary, description, price, location, address, maps_url, images, meta, translations, published, featured)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [input.category, slug, input.title, input.summary, input.description, input.price, input.location, input.address,
          input.mapsUrl, JSON.stringify(input.images), JSON.stringify(input.meta), JSON.stringify(input.translations ?? {}),
          input.published ? 1 : 0, input.featured ? 1 : 0],
      );
      return (await getListingById(res.insertId))!;
    } catch (e) {
      if (isDuplicateError(e)) continue; // slug already taken, try the next suffix
      throw e;
    }
  }
  throw new Error('Tidak bisa membuat alamat (slug) unik untuk listing ini.');
}

/** The slug is kept on edit on purpose so public URLs (and search rankings) don't change. */
export async function updateListing(id: number, input: ListingInput): Promise<Listing | null> {
  await exec(
    `UPDATE listings SET category=?, title=?, summary=?, description=?, price=?, location=?, address=?, maps_url=?,
       images=?, meta=?, translations=?, published=?, featured=?, updated_at=CURRENT_TIMESTAMP(3) WHERE id=?`,
    [input.category, input.title, input.summary, input.description, input.price, input.location, input.address,
      input.mapsUrl, JSON.stringify(input.images), JSON.stringify(input.meta), JSON.stringify(input.translations ?? {}),
      input.published ? 1 : 0, input.featured ? 1 : 0, id],
  );
  return getListingById(id);
}

export async function deleteListing(id: number): Promise<void> {
  await exec('DELETE FROM listings WHERE id = ?', [id]);
}

export async function countListings(): Promise<{ total: number; published: number; byCategory: Record<Category, number> }> {
  const rows = await q<{ category: Category; n: number; p: number | null }>(
    'SELECT category, COUNT(*) AS n, SUM(published) AS p FROM listings GROUP BY category',
  );
  const byCategory = { villa: 0, mobil: 0, motor: 0, tour: 0 } as Record<Category, number>;
  let total = 0;
  let published = 0;
  for (const r of rows) {
    const p = Number(r.p ?? 0);
    byCategory[r.category] = p; // only what visitors can see
    total += Number(r.n);
    published += p;
  }
  return { total, published, byCategory };
}

/* ---------------------------- Testimonials ---------------------------- */

type TestimonialRow = { id: number; name: string; origin: string; quote: string; photo: string; translations: string | null; rating: number; published: number; sort_order: number };
const toTestimonial = (r: TestimonialRow): Testimonial => ({
  id: r.id, name: r.name, origin: r.origin, quote: r.quote, photo: r.photo,
  translations: parseJson<TestimonialTranslations>(r.translations, {}), rating: r.rating,
  published: r.published === 1, sortOrder: r.sort_order,
});

export async function listTestimonials(opts: { publishedOnly?: boolean; limit?: number } = {}): Promise<Testimonial[]> {
  const limit = opts.limit ? ` LIMIT ${Math.max(1, Math.trunc(opts.limit))}` : '';
  const sql = `SELECT * FROM testimonials ${opts.publishedOnly ? 'WHERE published = 1' : ''} ORDER BY sort_order ASC, id DESC${limit}`;
  return (await q<TestimonialRow>(sql)).map(toTestimonial);
}

export async function getTestimonial(id: number): Promise<Testimonial | null> {
  const r = await q1<TestimonialRow>('SELECT * FROM testimonials WHERE id = ?', [id]);
  return r ? toTestimonial(r) : null;
}

export async function createTestimonial(t: TestimonialInput): Promise<void> {
  await exec('INSERT INTO testimonials (name, origin, quote, photo, translations, rating, published) VALUES (?,?,?,?,?,?,?)',
    [t.name, t.origin, t.quote, t.photo, JSON.stringify(t.translations ?? {}), t.rating, t.published ? 1 : 0]);
}

export async function updateTestimonial(id: number, t: TestimonialInput): Promise<void> {
  await exec('UPDATE testimonials SET name=?, origin=?, quote=?, photo=?, translations=?, rating=?, published=? WHERE id=?',
    [t.name, t.origin, t.quote, t.photo, JSON.stringify(t.translations ?? {}), t.rating, t.published ? 1 : 0, id]);
}

export async function deleteTestimonial(id: number): Promise<void> {
  await exec('DELETE FROM testimonials WHERE id = ?', [id]);
}

/* ------------------------------ Settings ------------------------------ */

export async function getSettings(): Promise<Settings> {
  const out = Object.fromEntries(SETTING_KEYS.map((k) => [k, ''])) as Settings;
  const rows = await q<{ setting_key: string; setting_value: string }>('SELECT setting_key, setting_value FROM settings');
  for (const r of rows) if ((SETTING_KEYS as readonly string[]).includes(r.setting_key)) out[r.setting_key as keyof Settings] = r.setting_value;
  return out;
}

export async function saveSettings(values: Partial<Settings>): Promise<void> {
  await tx(async (c) => {
    for (const k of SETTING_KEYS) {
      if (values[k] === undefined) continue;
      await c.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [k, values[k]],
      );
    }
  });
}

/* ------------------------------- Admins ------------------------------- */

export type Admin = { id: number; email: string; passwordHash: string; mustChangePassword: boolean };
type AdminRow = { id: number; email: string; password_hash: string; must_change_password: number };
const toAdmin = (r: AdminRow): Admin => ({ id: r.id, email: r.email, passwordHash: r.password_hash, mustChangePassword: r.must_change_password === 1 });

export async function findAdminByEmail(email: string): Promise<Admin | null> {
  const r = await q1<AdminRow>('SELECT id, email, password_hash, must_change_password FROM admins WHERE email = ?', [email.toLowerCase()]);
  return r ? toAdmin(r) : null;
}

export async function getAdminById(id: number): Promise<Admin | null> {
  const r = await q1<AdminRow>('SELECT id, email, password_hash, must_change_password FROM admins WHERE id = ?', [id]);
  return r ? toAdmin(r) : null;
}

export async function countAdmins(): Promise<number> {
  return Number((await q1<{ n: number }>('SELECT COUNT(*) AS n FROM admins'))!.n);
}

export async function createAdmin(email: string, passwordHash: string, mustChangePassword = false): Promise<void> {
  await exec('INSERT INTO admins (email, password_hash, must_change_password) VALUES (?,?,?)', [email.toLowerCase(), passwordHash, mustChangePassword ? 1 : 0]);
}

export async function updateAdminPassword(id: number, passwordHash: string): Promise<void> {
  await exec('UPDATE admins SET password_hash = ?, must_change_password = 0 WHERE id = ?', [passwordHash, id]);
}
