import Link from 'next/link';
import { getSettings } from '@enjaz/core';
import { List, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { getDict, localePath, type Locale } from '@/i18n';
import { waLink } from '@/lib/site';
import { LangSwitcher } from './LangSwitcher';

export async function Header({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const wa = waLink((await getSettings()).whatsapp, d.wa.general);
  const nav = [
    { href: localePath(locale, '/villa'), label: d.nav.villa },
    { href: localePath(locale, '/mobil'), label: d.nav.mobil },
    { href: localePath(locale, '/motor'), label: d.nav.motor },
    { href: localePath(locale, '/tour'), label: d.nav.tour },
    { href: `${localePath(locale, '/')}#testimoni`, label: d.nav.testimoni },
  ];
  return (
    <header className="site-header">
      <Link href={localePath(locale, '/')} className="brand" aria-label={d.nav.brand}>
        <img className="logo-on-light" src="/logo-icon.png" alt="" width={38} height={47} />
        <img className="logo-on-dark" src="/logo-icon-light.png" alt="" width={38} height={47} />
        <span>
          <strong>Enjaz</strong>
          <small>Instan Properti</small>
        </span>
      </Link>

      <nav aria-label={d.nav.mainMenu} className="nav-desktop">
        {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
      </nav>

      <div className="header-actions">
        <LangSwitcher current={locale} label={d.nav.language} />
        {wa && (
          <a className="btn btn-gold btn-sm btn-wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label={d.nav.whatsapp}>
            <WhatsappLogo size={20} weight="bold" aria-hidden /> <span className="wa-label">{d.nav.whatsapp}</span>
          </a>
        )}
        <details className="nav-mobile">
          <summary aria-label={d.nav.menu}><List size={26} aria-hidden /></summary>
          <nav aria-label={d.nav.mobileMenu}>
            {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
