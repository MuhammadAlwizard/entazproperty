// Writes a full backup to ./backups/<timestamp>/ : content.json plus every uploaded photo as a file.
// Restoring is a manual job (see import-json for the content part). Also use your host's own backups.
import fs from 'node:fs';
import path from 'node:path';
import { closePool, q } from '../db';
import { exportContent } from '../security';

const root = path.resolve(process.cwd(), process.env.BACKUP_DIR || '../../backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.join(root, stamp);
fs.mkdirSync(path.join(dir, 'uploads'), { recursive: true });

fs.writeFileSync(path.join(dir, 'content.json'), JSON.stringify(await exportContent(), null, 2));
const photos = await q<{ id: string; ext: string; bytes: Buffer }>('SELECT id, ext, bytes FROM uploads');
for (const p of photos) fs.writeFileSync(path.join(dir, 'uploads', `${p.id}.${p.ext}`), p.bytes);
console.log(`Cadangan disimpan di ${dir}  (${photos.length} foto)`);
await closePool();
