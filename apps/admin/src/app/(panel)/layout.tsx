import { ArrowSquareOut, SignOut } from '@phosphor-icons/react/dist/ssr';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { logout } from '../login/actions';
import { SideNav } from '@/components/SideNav';

const PUBLIC_URL = process.env.PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'http://localhost:3100';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Only checks that someone is signed in. Each page enforces the rest (see requireAdmin), otherwise
  // an admin who must change the first password would be redirected in a loop.
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo-icon.png" alt="" width={30} height={37} />
          <div>
            <strong>Enjaz</strong>
            <small>Panel admin</small>
          </div>
        </div>
        <SideNav />
        <div className="sidebar-foot">
          <a href={PUBLIC_URL} target="_blank" rel="noopener noreferrer" className="side-link">
            Lihat website <ArrowSquareOut size={16} aria-hidden />
          </a>
          <p className="muted small">{session.email}</p>
          <form action={logout}>
            <button className="side-link side-link-button"><SignOut size={16} aria-hidden /> Keluar</button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
