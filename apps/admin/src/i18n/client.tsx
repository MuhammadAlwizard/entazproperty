'use client';

import { createContext, useContext } from 'react';
import type { Locale } from './config';
import type { Dict } from './dictionaries/id';

const Ctx = createContext<{ locale: Locale; d: Dict } | null>(null);

/** Hands the active dictionary to client components. Rendered once in the root layout. */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, d: dict }}>{children}</Ctx.Provider>;
}

export function useI18n(): { locale: Locale; d: Dict } {
  const value = useContext(Ctx);
  if (!value) throw new Error('useI18n must be used inside I18nProvider (see app/layout.tsx).');
  return value;
}
