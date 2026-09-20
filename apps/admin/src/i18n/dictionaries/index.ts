import type { Locale } from '../config';
import { ar } from './ar';
import { en } from './en';
import { id, type Dict } from './id';

export type { Dict };

/** Server-side only: client components get the ACTIVE dictionary through I18nProvider, so they never bundle all three. */
export const dictionaries: Record<Locale, Dict> = { id, en, ar };
