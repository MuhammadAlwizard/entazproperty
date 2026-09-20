import { LOCALES, LOCALE_META } from '@/i18n/config';
import { setLocale } from '@/i18n/actions';
import { getI18n } from '@/i18n/server';

/** Three small buttons in one form; works without JavaScript. Sits in the sidebar and on the login page. */
export async function LangSwitch() {
  const { locale, d } = await getI18n();
  return (
    <form action={setLocale} className="lang-switch" aria-label={d.lang.label}>
      {LOCALES.map((l) => (
        <button
          key={l}
          name="lang"
          value={l}
          lang={LOCALE_META[l].htmlLang}
          className={l === locale ? 'active' : undefined}
          aria-current={l === locale ? 'true' : undefined}
        >
          {LOCALE_META[l].name}
        </button>
      ))}
    </form>
  );
}
