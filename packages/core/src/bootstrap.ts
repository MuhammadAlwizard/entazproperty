import { countAdmins, createAdmin } from './queries';
import { migrate } from './migrations';
import { checkNewPassword, hashPassword } from './password';

/**
 * Runs when a Node.js app starts (see instrumentation.ts in both apps): brings the database schema
 * up to date and, if there is no admin yet and ADMIN_EMAIL/ADMIN_PASSWORD are set, creates the first
 * admin. That way deploying needs no shell access to the server and no remote database connection.
 * After the first login (which forces a new password) delete ADMIN_PASSWORD from the environment.
 */
export async function bootstrap(): Promise<void> {
  const applied = await migrate();
  if (applied.length) console.log(`[db] migrasi dijalankan: ${applied.join(', ')}`);

  // Optional, for previewing the design on a fresh database: SEED_SAMPLE=1 fills empty listings and
  // testimonials with the FAKE sample content (see seed.ts). It never touches content that exists.
  // Set it on ONE app only (the admin), then remove it; two apps starting together could both seed.
  if (process.env.SEED_SAMPLE === '1') {
    const { seedSampleContent } = await import('./seed');
    const added = await seedSampleContent();
    if (added.listings || added.testimonials) {
      console.log(`[db] data contoh (PALSU) ditambahkan: ${added.listings} listing, ${added.testimonials} testimoni. Hapus SEED_SAMPLE dari environment.`);
    }
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if ((await countAdmins()) > 0) return;

  const problem = checkNewPassword(password, email);
  if (problem) {
    console.error(`[db] admin pertama TIDAK dibuat, ADMIN_PASSWORD ditolak: ${problem}`);
    return;
  }
  await createAdmin(email, hashPassword(password), true);
  console.log(`[db] admin pertama dibuat: ${email} (wajib ganti password saat login pertama)`);
}
