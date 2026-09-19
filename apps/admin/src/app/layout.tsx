import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Admin | PT Enjaz Instan Properti', template: '%s | Admin Enjaz' },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const csp = (await headers()).get('x-csp-meta') || undefined;
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <head>{csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}</head>
      <body>{children}</body>
    </html>
  );
}
