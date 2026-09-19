'use client';

import { useEffect, useRef, useState } from 'react';

const INTERVAL_MS = 6000;
/** Wait this long before fetching the extra slides so the first photo paints first. */
const LOAD_REST_AFTER_MS = 2500;

/**
 * Full-bleed hero background. One photo stays still. Several photos crossfade
 * (opacity only). Rotation stops for visitors who prefer reduced motion, when the
 * tab is hidden, and while the pointer or keyboard focus is inside the hero
 * (so anyone can hold a photo still without a visible control).
 */
export function HeroSlider({ images }: { images: string[] }) {
  const count = images.length;
  const mediaRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(1); // how many slides are in the DOM
  const [holding, setHolding] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (count < 2) return;
    const t = window.setTimeout(() => setMounted(count), LOAD_REST_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [count]);

  // Hold the current photo while the pointer or keyboard focus is anywhere in the hero.
  useEffect(() => {
    const hero = mediaRef.current?.closest('.hero');
    if (!hero) return;
    const on = () => setHolding(true);
    const off = () => setHolding(false);
    hero.addEventListener('mouseenter', on);
    hero.addEventListener('mouseleave', off);
    hero.addEventListener('focusin', on);
    hero.addEventListener('focusout', off);
    return () => {
      hero.removeEventListener('mouseenter', on);
      hero.removeEventListener('mouseleave', off);
      hero.removeEventListener('focusin', on);
      hero.removeEventListener('focusout', off);
    };
  }, [count]);

  const ready = count > 1 && mounted >= count;

  // `active` is a dependency so choosing a photo by hand restarts the timer.
  useEffect(() => {
    if (!ready || holding || reduced) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [ready, holding, reduced, count, active]);

  if (count === 0) return null;

  return (
    <>
      <div className="hero-media" aria-hidden="true" ref={mediaRef}>
        {images.slice(0, mounted).map((src, i) => (
          <img
            key={`${i}-${src}`}
            src={src}
            alt=""
            className={i === active ? 'is-active' : undefined}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            decoding="async"
          />
        ))}
      </div>

      {ready && (
        <div className="hero-controls" role="group" aria-label="Pilih foto latar">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`hero-idx ${i === active ? 'is-active' : ''}`}
              aria-label={`Tampilkan foto ${i + 1} dari ${count}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </>
  );
}
