import { migrate } from '../migrations';
import { closePool } from '../db';

const applied = await migrate();
console.log(applied.length ? `Migrasi dijalankan: ${applied.join(', ')}` : 'Skema sudah terbaru, tidak ada migrasi baru.');
await closePool();
