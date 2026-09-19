import type { Metadata } from 'next';
import { getSettings, listAdminSessions } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { EmailForm, PasswordForm, SettingsForm } from './SettingsForms';
import { changeEmailAction, changePasswordAction, revokeOtherSessionsAction, saveSettingsAction } from './actions';

export const metadata: Metadata = { title: 'Pengaturan' };

const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

/** "Chrome di Windows" style summary from a raw user agent string. */
function deviceLabel(ua: string): string {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Peramban';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'perangkat lain';
  return `${browser} di ${os}`;
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ wajib?: string }> }) {
  const session = await requireAdmin({ allowMustChange: true });
  const sp = await searchParams;
  const [settings, sessions] = await Promise.all([getSettings(), listAdminSessions(session.adminId, session.sessionId)]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Pengaturan</h1>
          <p className="muted">Kontak perusahaan, foto hero, dan keamanan akun.</p>
        </div>
      </header>

      {(session.mustChangePassword || sp.wajib) && (
        <p className="notice notice-error" role="alert">
          Kamu masih memakai password awal. Ganti dulu di bagian &quot;Ganti password&quot; di bawah. Menu lain terkunci sampai password diganti.
        </p>
      )}

      {!session.mustChangePassword && <SettingsForm settings={settings} action={saveSettingsAction} />}
      <div style={{ height: 32 }} />
      <PasswordForm action={changePasswordAction} />
      {!session.mustChangePassword && (
        <>
          <div style={{ height: 32 }} />
          <EmailForm action={changeEmailAction} current={session.email} />
        </>
      )}

      {!session.mustChangePassword && (
        <section className="form-card" style={{ marginTop: 32 }} aria-labelledby="cadangan-title">
          <fieldset className="group">
            <legend id="cadangan-title">Cadangan data</legend>
            <p className="muted small">
              Unduh semua isi website (listing, testimoni, pengaturan) sebagai satu file. Password tidak ikut. Foto tidak ikut di file ini,
              simpan cadangan penuh lewat backup database di hosting atau perintah <code>npm run backup</code>.
            </p>
            <a className="btn btn-primary" href="/backup" style={{ alignSelf: 'flex-start' }}>Unduh cadangan</a>
          </fieldset>
        </section>
      )}

      <section className="form-card" style={{ marginTop: 32 }} aria-labelledby="sesi-title">
        <fieldset className="group">
          <legend id="sesi-title">Perangkat yang sedang masuk</legend>
          <ul className="session-list">
            {sessions.map((x) => (
              <li key={x.id}>
                <div>
                  <strong>{deviceLabel(x.userAgent)}</strong>{x.current && <span className="pill pill-ok" style={{ marginLeft: 8 }}>Perangkat ini</span>}
                  <p className="muted small">Terakhir aktif {fmt.format(new Date(x.lastSeenAt))} · alamat {x.ip || 'tidak diketahui'}</p>
                </div>
              </li>
            ))}
          </ul>
          {sessions.length > 1 ? (
            <form action={revokeOtherSessionsAction}>
              <button className="btn-danger-text">Keluarkan semua perangkat lain</button>
            </form>
          ) : (
            <p className="muted small">Hanya perangkat ini yang sedang masuk.</p>
          )}
        </fieldset>
      </section>
    </>
  );
}
