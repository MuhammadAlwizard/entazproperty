import type { Metadata } from 'next';
import { getSettings, listAdminSessions } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { dateTimeFormat, fill, splitAt } from '@/i18n/format';
import type { Dict } from '@/i18n/dictionaries';
import { EmailForm, PasswordForm, SettingsForm } from './SettingsForms';
import { changeEmailAction, changePasswordAction, revokeOtherSessionsAction, saveSettingsAction } from './actions';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.settings.title };
}

/** "Chrome on Windows" style summary from a raw user agent string, in the panel language. */
function deviceLabel(ua: string, d: Dict): string {
  const s = d.settings.sessions;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : s.unknownBrowser;
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : s.unknownOs;
  return fill(s.device, { browser, os });
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ wajib?: string }> }) {
  const session = await requireAdmin({ allowMustChange: true });
  const { locale, d } = await getI18n();
  const t = d.settings;
  const fmt = dateTimeFormat(locale, 'short');
  const sp = await searchParams;
  const [settings, sessions] = await Promise.all([getSettings(), listAdminSessions(session.adminId, session.sessionId)]);
  const [backupBefore, backupAfter] = splitAt(t.backup.text, '{cmd}');

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t.title}</h1>
          <p className="muted">{t.lead}</p>
        </div>
      </header>

      {(session.mustChangePassword || sp.wajib) && (
        <p className="notice notice-error" role="alert">{t.mustChange}</p>
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
            <legend id="cadangan-title">{t.backup.legend}</legend>
            <p className="muted small">{backupBefore}<code dir="ltr">npm run backup</code>{backupAfter}</p>
            <a className="btn btn-primary" href="/backup" style={{ alignSelf: 'flex-start' }}>{t.backup.button}</a>
          </fieldset>
        </section>
      )}

      <section className="form-card" style={{ marginTop: 32 }} aria-labelledby="sesi-title">
        <fieldset className="group">
          <legend id="sesi-title">{t.sessions.legend}</legend>
          <ul className="session-list">
            {sessions.map((x) => (
              <li key={x.id}>
                <div>
                  <strong>{deviceLabel(x.userAgent, d)}</strong>{x.current && <span className="pill pill-ok" style={{ marginInlineStart: 8 }}>{t.sessions.thisDevice}</span>}
                  <p className="muted small">{fill(t.sessions.lastActive, { date: fmt.format(new Date(x.lastSeenAt)), ip: x.ip || t.sessions.unknownIp })}</p>
                </div>
              </li>
            ))}
          </ul>
          {sessions.length > 1 ? (
            <form action={revokeOtherSessionsAction}>
              <button className="btn-danger-text">{t.sessions.revokeOthers}</button>
            </form>
          ) : (
            <p className="muted small">{t.sessions.onlyThis}</p>
          )}
        </fieldset>
      </section>
    </>
  );
}
