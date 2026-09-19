import type { Metadata } from 'next';
import { listAudit } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Aktivitas' };

const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta' });

const LABEL: Record<string, string> = {
  'login.success': 'Masuk',
  'login.failed': 'Gagal masuk (password salah)',
  'login.blocked': 'Percobaan masuk diblokir (terlalu banyak)',
  logout: 'Keluar',
  'listing.create': 'Menambah listing',
  'listing.update': 'Mengubah listing',
  'listing.delete': 'Menghapus listing',
  'testimonial.create': 'Menambah testimoni',
  'testimonial.update': 'Mengubah testimoni',
  'testimonial.delete': 'Menghapus testimoni',
  'settings.update': 'Mengubah pengaturan',
  'password.change': 'Mengganti password',
  'password.change.failed': 'Gagal ganti password (password saat ini salah)',
  'sessions.revoke_others': 'Mengeluarkan perangkat lain',
  upload: 'Mengunggah foto',
  'backup.download': 'Mengunduh cadangan data',
};
const WARN = new Set(['login.failed', 'login.blocked', 'password.change.failed']);

export default async function ActivityPage() {
  await requireAdmin();
  const rows = await listAudit(150);
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Aktivitas</h1>
          <p className="muted">Siapa melakukan apa di panel admin (150 kejadian terakhir). Percobaan masuk yang gagal ditandai merah.</p>
        </div>
      </header>
      {rows.length === 0 ? (
        <div className="empty-state"><h2>Belum ada aktivitas</h2></div>
      ) : (
        <div className="table-wrap">
          <table className="activity">
            <thead>
              <tr><th scope="col">Waktu</th><th scope="col">Akun</th><th scope="col">Kejadian</th><th scope="col">Alamat</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmt.format(new Date(r.at))}</td>
                  <td>{r.email || '-'}</td>
                  <td className={WARN.has(r.action) ? 'tag-warn' : undefined}>
                    {LABEL[r.action] ?? r.action}{r.target ? <span className="muted">{`: ${r.target}`}</span> : null}
                  </td>
                  <td className="muted">{r.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
