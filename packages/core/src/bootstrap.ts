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
