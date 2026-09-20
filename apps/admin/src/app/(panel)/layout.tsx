import { ArrowSquareOut, SignOut } from '@phosphor-icons/react/dist/ssr';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { logout } from '../login/actions';
import { LangSwitch } from '@/components/LangSwitch';
import { SideNav } from '@/components/SideNav';

const PUBLIC_URL = process.env.PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'http://localhost:3100';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Only checks that someone is signed in. Each page enforces the rest (see requireAdmin), otherwise
  // an admin who must change the first password would be redirected in a loop.
  const session = await getSession();
  if (!session) redirect('/login');
  const { d } = await getI18n();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo-icon.png" alt="" width={30} height={37} />
          <div>
            <strong>{d.brand.name}</strong>
            <small>{d.brand.subtitle}</small>
          </div>
        </div>
        <SideNav />
        <div className="sidebar-foot">
          <LangSwitch />
          <a href={PUBLIC_URL} target="_blank" rel="noopener noreferrer" className="side-link">
            {d.nav.viewSite} <ArrowSquareOut size={16} aria-hidden />
          </a>
          <p className="muted small cell-ltr">{session.email}</p>
          <form action={logout}>
            <button className="side-link side-link-button"><SignOut size={16} aria-hidden /> {d.nav.signOut}</button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
