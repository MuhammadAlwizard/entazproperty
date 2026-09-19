import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Bricolage_Grotesque, Hanken_Grotesk, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LOCALES, LOCALE_META, getDict, isLocale } from '@/i18n';
import { COMPANY, SITE_URL, alternatesFor } from '@/lib/site';
import '../globals.css';

// Content comes from the shared database the admin edits, so never prerender.
export const dynamic = 'force-dynamic';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
// Arabic script needs its own font (the two above have no Arabic glyphs). Not preloaded: the browser only
// downloads it when a page actually shows Arabic text, so Indonesian and English pages pay nothing.
const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-arabic', display: 'swap', preload: false });

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDict(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: d.meta.title, template: `%s | ${COMPANY}` },
    description: d.meta.description,
    alternates: alternatesFor(lang, '/'),
    openGraph: {
      type: 'website',
      siteName: COMPANY,
      locale: LOCALE_META[lang].og,
      alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => LOCALE_META[l].og),
      title: d.meta.title,
      description: d.meta.description,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: COMPANY }],
    },
    twitter: { card: 'summary_large_image', title: d.meta.title, description: d.meta.description, images: ['/og.png'] },
  };
}

export const viewport: Viewport = { themeColor: '#F4F6F9' };

export default async function LangLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound(); // proxy.ts guarantees a valid language, this is only a safety net
  const meta = LOCALE_META[lang];
  const d = getDict(lang);
  const csp = (await headers()).get('x-csp-meta') || undefined;

  return (
    <html lang={meta.htmlLang} dir={meta.dir} className={`${display.variable} ${body.variable} ${arabic.variable}`}>
      <head>{csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}</head>
      <body>
        <a href="#isi" className="skip">{d.skip}</a>
        <Header locale={lang} />
        <main id="isi">{children}</main>
        <Footer locale={lang} />
      </body>
    </html>
  );
}
