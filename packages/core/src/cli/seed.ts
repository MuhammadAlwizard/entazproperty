import { ensureAdmin, seedSampleContent } from '../seed';
import { migrate } from '../migrations';
import { closePool } from '../db';
import { checkNewPassword } from '../password';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('ADMIN_EMAIL dan ADMIN_PASSWORD harus diisi di file .env (lihat .env.example).');
  process.exit(1);
}
const problem = checkNewPassword(password, email);
if (problem) {
  console.error(`ADMIN_PASSWORD ditolak: ${problem}`);
  process.exit(1);
}

await migrate();
const created = await ensureAdmin(email, password);
console.log(created ? `Admin dibuat: ${email} (wajib ganti password saat login pertama)` : 'Admin sudah ada, tidak diubah.');

if (process.env.SEED_SAMPLE === '0') {
  console.log('Data contoh dilewati (SEED_SAMPLE=0).');
} else {
  const { listings, testimonials } = await seedSampleContent();
  console.log(`Data contoh: ${listings} listing, ${testimonials} testimoni ditambahkan (0 = sudah ada data).`);
}
await closePool();
