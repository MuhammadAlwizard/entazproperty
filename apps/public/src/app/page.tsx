import type { Metadata } from 'next';
import { getSettings, listTestimonials, parseHeroImages } from '@enjaz/core';
import { HeroSlider } from '@/components/HeroSlider';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { COMPANY, SITE_URL, jsonLd } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: `${COMPANY} | Sewa Villa, Mobil, Motor dan Tour` },
  alternates: { canonical: '/' },
};

export default async function Home() {
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
        <HeroSlider images={heroImages} />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <h1 id="hero-title">
            Villa, kendaraan, dan tour.<br />Satu tempat.
          </h1>
          <p>Sewa villa dengan lokasi jelas, kendaraan siap jalan, dan paket wisata dari PT Enjaz Instan Properti.</p>
          <a href="#layanan" className="btn btn-gold">Pilih layanan</a>
        </div>
      </section>

      {/* Villa, Mobil, Motor, Travel & Tour: four cards, each opens its own category page */}
      <Services />

      <Testimonials items={testimonials} />
    </>
  );
}
