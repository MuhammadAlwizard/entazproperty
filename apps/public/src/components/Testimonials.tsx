import { Star } from '@phosphor-icons/react/dist/ssr';
import { localizeTestimonial, type Testimonial } from '@enjaz/core';
import { fill, getDict, type Dict, type Locale } from '@/i18n';

function Stars({ n, dict }: { n: number; dict: Dict }) {
  return (
    <span className="stars" role="img" aria-label={fill(dict.testimonials.stars, { n })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} weight={i < n ? 'fill' : 'regular'} aria-hidden />
      ))}
    </span>
  );
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

function Card({ t, dict }: { t: Testimonial; dict: Dict }) {
  return (
    <figure className="tst-card">
      {t.photo ? (
        <img className="tst-avatar" src={t.photo} alt="" width={64} height={64} loading="lazy" decoding="async" />
      ) : (
        <span className="tst-avatar tst-initials" aria-hidden>{initials(t.name)}</span>
      )}
      <div className="tst-body">
        <Stars n={t.rating} dict={dict} />
        <blockquote>{t.quote}</blockquote>
        <figcaption>
          <strong>{t.name}</strong>
          {t.origin && <span>{t.origin}</span>}
        </figcaption>
      </div>
    </figure>
  );
}

/**
 * Endless horizontal ticker (same idea as the Yasbutiii site). The track holds two identical
 * halves and slides by exactly one half, so the loop has no visible jump. Each half repeats
 * the list until it is wide enough to cover big screens. It pauses on hover and on keyboard focus.
 * With reduced motion it becomes a normal swipeable row (copies are hidden). In right-to-left
 * languages the track moves the other way (see .tst-track in globals.css).
 */
export function Testimonials({ items, locale }: { items: Testimonial[]; locale: Locale }) {
  if (!items.length) return null;
  const d = getDict(locale);
  const localized = items.map((t) => localizeTestimonial(t, locale));
  const reps = Math.max(1, Math.ceil(8 / localized.length));
  const half = Array.from({ length: reps }, () => localized).flat();
  const seconds = Math.max(32, half.length * 5);

  return (
    <section id="testimoni" className="sec-testi" aria-labelledby="testimoni-title">
      <div className="tst-head">
        <h2 id="testimoni-title">{d.testimonials.title}</h2>
      </div>
      <div className="tst-marquee" tabIndex={0} role="region" aria-label={d.testimonials.region}>
        <div className="tst-track" style={{ ['--tst-duration' as string]: `${seconds}s` }}>
          <div className="tst-half">
            {half.map((t, i) => <Card key={`a-${i}-${t.id}`} t={t} dict={d} />)}
          </div>
          <div className="tst-half tst-copy" aria-hidden="true">
            {half.map((t, i) => <Card key={`b-${i}-${t.id}`} t={t} dict={d} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
