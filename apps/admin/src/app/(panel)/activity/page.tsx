import type { Metadata } from 'next';
import { listAudit } from '@enjaz/core';
import { requireAdmin } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { dateTimeFormat } from '@/i18n/format';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.activity.title };
}

const WARN = new Set(['login.failed', 'login.blocked', 'password.change.failed', 'email.change.failed']);

export default async function ActivityPage() {
  await requireAdmin();
  const { locale, d } = await getI18n();
  const t = d.activity;
  const labels: Record<string, string> = t.labels;
  const fmt = dateTimeFormat(locale, 'medium');
  const rows = await listAudit(150);
  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t.title}</h1>
          <p className="muted">{t.lead}</p>
        </div>
      </header>
      {rows.length === 0 ? (
        <div className="empty-state"><h2>{t.emptyTitle}</h2></div>
      ) : (
        <div className="table-wrap">
          <table className="activity">
            <thead>
              <tr><th scope="col">{t.colTime}</th><th scope="col">{t.colAccount}</th><th scope="col">{t.colEvent}</th><th scope="col">{t.colIp}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><bdi>{fmt.format(new Date(r.at))}</bdi></td>
                  <td className="cell-ltr">{r.email || '-'}</td>
                  <td className={WARN.has(r.action) ? 'tag-warn' : undefined}>
                    {labels[r.action] ?? r.action}{r.target ? <span className="muted">{`: `}<bdi>{r.target}</bdi></span> : null}
                  </td>
                  <td className="muted cell-ltr">{r.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
