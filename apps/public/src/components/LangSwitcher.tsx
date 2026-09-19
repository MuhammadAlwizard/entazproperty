'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from '@phosphor-icons/react';
import { LOCALES, LOCALE_META, localePath, splitLocale, type Locale } from '@/i18n/config';

/**
 * Language switcher. It is a client component on purpose: the header lives in the layout and is not
 * re-rendered when the visitor navigates, so it reads the current path itself and always links to
 * the SAME page in the other language.
 */
export function LangSwitcher({ current, label, variant = 'menu' }: { current: Locale; label: string; variant?: 'menu' | 'inline' }) {
  const pathname = usePathname();
  const { path } = splitLocale(pathname);

  const links = LOCALES.map((l) => (
    <Link
      key={l}
      href={localePath(l, path)}
      hrefLang={LOCALE_META[l].htmlLang}
      lang={LOCALE_META[l].htmlLang}
      aria-current={l === current ? 'true' : undefined}
      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
    >
      {LOCALE_META[l].name}
    </Link>
  ));

  if (variant === 'inline') {
    return <ul className="lang-inline" aria-label={label}>{links.map((a, i) => <li key={LOCALES[i]}>{a}</li>)}</ul>;
  }

  return (
    <details className="lang">
      <summary aria-label={`${label}: ${LOCALE_META[current].name}`}>
        <Globe size={20} aria-hidden />
        <span className="lang-name">{LOCALE_META[current].name}</span>
        <span className="lang-short" aria-hidden>{LOCALE_META[current].short}</span>
      </summary>
      <ul>{links.map((a, i) => <li key={LOCALES[i]}>{a}</li>)}</ul>
    </details>
  );
}
