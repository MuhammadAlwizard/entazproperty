import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Bricolage_Grotesque, Hanken_Grotesk, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { LOCALE_META } from '@/i18n/config';
import { I18nProvider } from '@/i18n/client';
import { getI18n } from '@/i18n/server';
import './globals.css';

export const dynamic = 'force-dynamic';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
// Arabic script needs its own font. Not preloaded: it is only downloaded when the panel is shown in Arabic.
const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-arabic', display: 'swap', preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: { default: d.meta.title, template: d.meta.template }, robots: { index: false, follow: false } };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const csp = (await headers()).get('x-csp-meta') || undefined;
  const { locale, d } = await getI18n();
  const meta = LOCALE_META[locale];
  return (
    <html lang={meta.htmlLang} dir={meta.dir} className={`${display.variable} ${body.variable} ${arabic.variable}`}>
      <head>{csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}</head>
      <body>
        <I18nProvider locale={locale} dict={d}>{children}</I18nProvider>
      </body>
    </html>
  );
}
