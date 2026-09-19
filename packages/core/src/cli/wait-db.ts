// Blocks until the database answers and the schema exists, so `npm run dev` can start the apps safely.
import { pool, closePool } from '../db';

const deadline = Date.now() + 240_000; // first run downloads MariaDB, which can take a while
for (;;) {
  try {
    await pool().query('SELECT 1 FROM schema_migrations LIMIT 1');
    break;
  } catch {
    if (Date.now() > deadline) {
      console.error('[wait-db] database tidak siap');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}
await closePool();
