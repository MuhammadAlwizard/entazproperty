import Link from 'next/link';
import { displayWhatsapp, getSettings, parseWhatsappNumbers } from '@enjaz/core';
import { getDict, localePath, type Locale } from '@/i18n';
import { COMPANY } from '@/lib/site';
import { LangSwitcher } from './LangSwitcher';

export async function Footer({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const s = await getSettings();
  const numbers = parseWhatsappNumbers(s.whatsapp);
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src="/logo-full.png" alt={COMPANY} width={260} height={113} loading="lazy" />
        </div>

        <div>
          <h2>{d.footer.services}</h2>
          <ul>
            <li><Link href={localePath(locale, '/villa')}>{d.categories.villa.name}</Link></li>
            <li><Link href={localePath(locale, '/mobil')}>{d.categories.mobil.name}</Link></li>
            <li><Link href={localePath(locale, '/motor')}>{d.categories.motor.name}</Link></li>
            <li><Link href={localePath(locale, '/tour')}>{d.categories.tour.name}</Link></li>
          </ul>
          <h2 className="footer-lang-title">{d.footer.language}</h2>
          <LangSwitcher current={locale} label={d.footer.language} variant="inline" />
        </div>

        <div>
          <h2>{d.footer.contact}</h2>
          <ul>
            {numbers.map((n) => (
              <li key={n}>
                <a href={`https://wa.me/${n}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="phone">WhatsApp {displayWhatsapp(n)}</a>
              </li>
            ))}
            {s.email && <li><a href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.instagram && <li dir="ltr" className="phone">{s.instagram}</li>}
            {s.address && <li className="footer-address">{s.address}</li>}
            {!numbers.length && !s.email && !s.address && <li>{d.footer.contactSoon}</li>}
          </ul>
        </div>
      </div>
      <p className="footer-note">&copy; {new Date().getFullYear()} {COMPANY}</p>
    </footer>
  );
}
