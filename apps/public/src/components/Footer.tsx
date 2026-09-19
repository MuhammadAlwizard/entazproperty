import Link from 'next/link';
import { displayWhatsapp, getSettings, parseWhatsappNumbers } from '@enjaz/core';
import { COMPANY } from '@/lib/site';

export async function Footer() {
  const s = await getSettings();
  const numbers = parseWhatsappNumbers(s.whatsapp);
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src="/logo-full.png" alt={COMPANY} width={260} height={113} loading="lazy" />
        </div>

        <div>
          <h2>Layanan</h2>
          <ul>
            <li><Link href="/villa">Villa</Link></li>
            <li><Link href="/mobil">Mobil</Link></li>
            <li><Link href="/motor">Motor</Link></li>
            <li><Link href="/tour">Travel &amp; Tour</Link></li>
          </ul>
        </div>

        <div>
          <h2>Kontak</h2>
          <ul>
            {numbers.map((n) => <li key={n}><a href={`https://wa.me/${n}`} target="_blank" rel="noopener noreferrer">WhatsApp {displayWhatsapp(n)}</a></li>)}
            {s.email && <li><a href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.instagram && <li>{s.instagram}</li>}
            {s.address && <li className="footer-address">{s.address}</li>}
            {!numbers.length && !s.email && !s.address && <li>Kontak akan segera ditambahkan.</li>}
          </ul>
        </div>
      </div>
      <p className="footer-note">&copy; {new Date().getFullYear()} {COMPANY}</p>
    </footer>
  );
}
