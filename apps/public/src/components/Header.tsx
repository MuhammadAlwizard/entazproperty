import Link from 'next/link';
import { getSettings } from '@enjaz/core';
import { List, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { waLink } from '@/lib/site';

const NAV = [
  { href: '/villa', label: 'Villa' },
  { href: '/mobil', label: 'Mobil' },
  { href: '/motor', label: 'Motor' },
  { href: '/tour', label: 'Tour & Travel' },
  { href: '/#testimoni', label: 'Testimoni' },
];

export async function Header() {
  const wa = waLink((await getSettings()).whatsapp, 'Halo, saya ingin bertanya tentang layanan PT Enjaz Instan Properti.');
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="PT Enjaz Instan Properti, beranda">
        <img className="logo-on-light" src="/logo-icon.png" alt="" width={38} height={47} />
        <img className="logo-on-dark" src="/logo-icon-light.png" alt="" width={38} height={47} />
        <span>
          <strong>Enjaz</strong>
          <small>Instan Properti</small>
        </span>
      </Link>

      <nav aria-label="Menu utama" className="nav-desktop">
        {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
      </nav>

      <div className="header-actions">
        {wa && (
          <a className="btn btn-gold btn-sm btn-wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp">
            <WhatsappLogo size={20} weight="bold" aria-hidden /> <span className="wa-label">Chat WhatsApp</span>
          </a>
        )}
        <details className="nav-mobile">
          <summary aria-label="Buka menu"><List size={26} aria-hidden /></summary>
          <nav aria-label="Menu utama (ponsel)">
            {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
