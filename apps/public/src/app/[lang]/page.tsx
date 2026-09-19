import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSettings, listTestimonials, parseHeroImages } from '@enjaz/core';
import { HeroSlider } from '@/components/HeroSlider';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { getDict, isLocale } from '@/i18n';
import { COMPANY, SITE_URL, alternatesFor, jsonLd } from '@/lib/site';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: { absolute: getDict(lang).meta.title }, alternates: alternatesFor(lang, '/') };
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDict(lang);
  const [settings, testimonials] = await Promise.all([getSettings(), listTestimonials({ publishedOnly: true, limit: 12 })]);
  const heroImages = parseHeroImages(settings.heroImages);

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-full.png`,
    ...(settings.email && { email: settings.email }),
    ...(settings.address && { address: settings.address }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(org) }} />

      {/* Hero: full-screen photo, header floats on top of it (see .hero in globals.css) */}
      <section className="hero" aria-labelledby="hero-title">
        <HeroSlider images={heroImages} labels={{ group: d.hero.groupLabel, show: d.hero.photoLabel }} />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <h1 id="hero-title">
            {d.hero.line1}<br />{d.hero.line2}
          </h1>
          <p>{d.hero.text}</p>
          <a href="#layanan" className="btn btn-gold">{d.hero.cta}</a>
        </div>
      </section>

      {/* Villa, Mobil, Motor, Travel & Tour: four cards, each opens its own category page */}
      <Services locale={lang} />

      <Testimonials items={testimonials} locale={lang} />
    </>
  );
}
