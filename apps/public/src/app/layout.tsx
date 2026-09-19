import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COMPANY, SITE_URL } from '@/lib/site';
import './globals.css';

// Content comes from the shared SQLite file the admin edits, so never prerender.
export const dynamic = 'force-dynamic';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const DESCRIPTION = 'Sewa villa dengan lokasi jelas, mobil, motor, dan paket travel tour dari PT Enjaz Instan Properti.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${COMPANY} | Sewa Villa, Mobil, Motor dan Tour`, template: `%s | ${COMPANY}` },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: COMPANY,
    locale: 'id_ID',
    title: `${COMPANY} | Sewa Villa, Mobil, Motor dan Tour`,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: COMPANY }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${COMPANY} | Sewa Villa, Mobil, Motor dan Tour`,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport: Viewport = { themeColor: '#F4F6F9' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#isi" className="skip">Langsung ke konten</a>
        <Header />
        <main id="isi">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
