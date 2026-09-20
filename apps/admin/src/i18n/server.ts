import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, type Locale } from './config';
import { dictionaries, type Dict } from './dictionaries';

/** The panel language of this request (from the cookie, Indonesian when there is none). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}

/** Both at once, for pages that also format dates or prices. */
export async function getI18n(): Promise<{ locale: Locale; d: Dict }> {
  const locale = await getLocale();
  return { locale, d: dictionaries[locale] };
}
