// Local development database (Windows): a portable MariaDB, downloaded once from the official
// archive, checksum-verified, and run from your user folder. No installer, no admin rights, no service.
// MariaDB speaks the same protocol and SQL dialect as the MySQL database that Hostinger provides.
// NOT for production. On other systems: run any MySQL yourself and set DATABASE_URL.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import mysql from 'mysql2/promise';
import { migrate } from '../migrations';
import { closePool } from '../db';

const VERSION = '11.8.9';
const ZIP_URL = `https://archive.mariadb.org/mariadb-${VERSION}/winx64-packages/mariadb-${VERSION}-winx64.zip`;
// From https://archive.mariadb.org/mariadb-11.8.9/winx64-packages/sha256sums.txt
const ZIP_SHA256 = '830c46727d9278eae212ae3eca44eeb9e71b2a68704e95f344a64fba7b1963f5';

// Kept outside the project folder on purpose: cloud-sync tools (OneDrive) corrupt live databases.
const root = process.env.MARIADB_DIR || path.join(process.env.LOCALAPPDATA || os.homedir(), 'enjaz-mariadb');
const home = path.join(root, `mariadb-${VERSION}-winx64`);
const dataDir = path.join(root, 'data');
const port = Number(process.env.MYSQL_DEV_PORT || 3307);
const bin = (name: string) => path.join(home, 'bin', name);

if (process.platform !== 'win32') {
  console.error('[dev-db] Skrip ini hanya untuk Windows. Jalankan MySQL/MariaDB sendiri, buat database "enjaz", lalu isi DATABASE_URL di .env.');
  process.exit(1);
}

async function download(): Promise<void> {
  fs.mkdirSync(root, { recursive: true });
  const zip = path.join(root, `mariadb-${VERSION}.zip`);
  console.log(`[dev-db] mengunduh MariaDB ${VERSION} (sekitar 97 MB, sekali saja) dari archive.mariadb.org ...`);
  const res = await fetch(ZIP_URL);
  if (!res.ok || !res.body) throw new Error(`unduhan gagal: HTTP ${res.status}`);
  const hash = createHash('sha256');
  const out = fs.createWriteStream(zip);
  let bytes = 0;
  let lastPrint = 0;
  for await (const chunk of Readable.fromWeb(res.body as never) as AsyncIterable<Buffer>) {
    hash.update(chunk);
    bytes += chunk.length;
    if (!out.write(chunk)) await new Promise<void>((r) => out.once('drain', () => r()));
    if (bytes - lastPrint > 10_000_000) { lastPrint = bytes; process.stdout.write(`\r[dev-db] ${(bytes / 1e6).toFixed(0)} MB`); }
  }
  await new Promise<void>((r) => out.end(() => r()));
  process.stdout.write('\n');
  if (hash.digest('hex') !== ZIP_SHA256) {
    fs.rmSync(zip, { force: true });
    throw new Error('checksum SHA-256 unduhan tidak cocok, file dibuang. Jangan lanjutkan.');
  }
  console.log('[dev-db] checksum cocok, mengekstrak ...');
  const r = spawnSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${root}' -Force`], { stdio: 'inherit' });
  fs.rmSync(zip, { force: true });
  if (r.status !== 0 || !fs.existsSync(bin('mariadbd.exe'))) throw new Error('ekstraksi gagal');
}

if (!fs.existsSync(bin('mariadbd.exe'))) await download();

if (!fs.existsSync(path.join(dataDir, 'mysql'))) {
  console.log('[dev-db] membuat folder data baru ...');
  const r = spawnSync(bin('mariadb-install-db.exe'), [`--datadir=${dataDir}`, '--silent'], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('mariadb-install-db gagal');
}

const child: ChildProcess = spawn(
  bin('mariadbd.exe'),
  [
    `--datadir=${dataDir}`, `--port=${port}`, '--bind-address=127.0.0.1', '--console', '--skip-name-resolve',
    '--character-set-server=utf8mb4', '--collation-server=utf8mb4_unicode_ci', '--max-allowed-packet=64M',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let tail: string[] = [];
const keep = (d: Buffer) => { tail = [...tail, ...d.toString().split('\n').filter(Boolean)].slice(-12); };
child.stdout?.on('data', keep);
child.stderr?.on('data', keep);
child.on('exit', (code) => {
  console.error(`[dev-db] server MariaDB berhenti (kode ${code}). Log terakhir:\n${tail.join('\n')}`);
  process.exit(code ?? 1);
});

// wait until it accepts connections, then make sure the database exists
let ready = false;
for (let i = 0; i < 80 && !ready; i++) {
  try {
    const c = await mysql.createConnection({ host: '127.0.0.1', port, user: 'root' });
    await c.query('CREATE DATABASE IF NOT EXISTS enjaz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await c.end();
    ready = true;
  } catch {
    await new Promise((r) => setTimeout(r, 750));
  }
}
if (!ready) { console.error('[dev-db] server tidak siap dalam 60 detik.\n' + tail.join('\n')); child.kill(); process.exit(1); }

console.log(`[dev-db] MariaDB lokal aktif di 127.0.0.1:${port}, database "enjaz"  (data: ${dataDir})`);
const applied = await migrate();
console.log(applied.length ? `[dev-db] migrasi dijalankan: ${applied.join(', ')}` : '[dev-db] skema sudah terbaru');
await closePool();

function stop() {
  child.removeAllListeners('exit');
  spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
