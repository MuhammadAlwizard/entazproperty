// Downloads every photo listed in a backup's content.json from a running site's /uploads/ address, so a
// backup made in the admin panel (content only) becomes complete. Each file must match the size in the list.
//   npm run fetch-photos -w @enjaz/core -- <content.json> <site url> <output folder>
import fs from 'node:fs';
import path from 'node:path';

const [file, site, out] = process.argv.slice(2);
if (!file || !site || !out) {
  console.error('Pemakaian: npm run fetch-photos -w @enjaz/core -- <content.json> <alamat situs> <folder tujuan>');
  process.exit(1);
}

type Upload = { id: string; ext: string; size: number };
const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as { uploads?: Upload[] };
const uploads = data.uploads ?? [];
fs.mkdirSync(path.resolve(out), { recursive: true });

const base = site.replace(/\/$/, '');
const failed: string[] = [];
for (const u of uploads) {
  if (!/^[0-9a-f-]{36}$/.test(u.id) || !/^(jpg|png|webp)$/.test(u.ext)) { failed.push(`${u.id}.${u.ext} (nama tidak dikenal)`); continue; }
  const name = `${u.id}.${u.ext}`;
  const target = path.join(path.resolve(out), name);
  if (fs.existsSync(target) && fs.statSync(target).size === Number(u.size)) continue; // already here from an earlier run
  const res = await fetch(`${base}/uploads/${name}`);
  const body = Buffer.from(await res.arrayBuffer());
  if (!res.ok || body.length !== Number(u.size)) {
    failed.push(`${name} (HTTP ${res.status}, ${body.length} byte, seharusnya ${u.size})`);
    continue;
  }
  fs.writeFileSync(target, body);
}

console.log(`Foto di daftar: ${uploads.length}, berhasil: ${uploads.length - failed.length}, gagal: ${failed.length}`);
for (const f of failed) console.log(`  GAGAL ${f}`);
process.exit(failed.length ? 1 : 0);
