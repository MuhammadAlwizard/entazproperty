import { Star } from '@phosphor-icons/react/dist/ssr';
import type { Testimonial } from '@enjaz/core';

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} dari 5 bintang`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} weight={i < n ? 'fill' : 'regular'} aria-hidden />
      ))}
    </span>
  );
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="tst-card">
      {t.photo ? (
        <img className="tst-avatar" src={t.photo} alt="" width={64} height={64} loading="lazy" decoding="async" />
      ) : (
        <span className="tst-avatar tst-initials" aria-hidden>{initials(t.name)}</span>
      )}
      <div className="tst-body">
        <Stars n={t.rating} />
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
 * halves and slides left by exactly one half, so the loop has no visible jump. Each half repeats
 * the list until it is wide enough to cover big screens. It pauses on hover and on keyboard focus.
 * With reduced motion it becomes a normal swipeable row (copies are hidden).
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  const reps = Math.max(1, Math.ceil(8 / items.length));
  const half = Array.from({ length: reps }, () => items).flat();
  const seconds = Math.max(32, half.length * 5);

  return (
    <section id="testimoni" className="sec-testi" aria-labelledby="testimoni-title">
      <div className="tst-head">
        <h2 id="testimoni-title">Kata mereka yang sudah menyewa</h2>
      </div>
      <div className="tst-marquee" tabIndex={0} role="region" aria-label="Testimoni pelanggan, berhenti saat disorot atau difokuskan">
        <div className="tst-track" style={{ ['--tst-duration' as string]: `${seconds}s` }}>
          <div className="tst-half">
            {half.map((t, i) => <Card key={`a-${i}-${t.id}`} t={t} />)}
          </div>
          <div className="tst-half tst-copy" aria-hidden="true">
            {half.map((t, i) => <Card key={`b-${i}-${t.id}`} t={t} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
