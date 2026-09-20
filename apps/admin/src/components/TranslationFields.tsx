'use client';

import { translatableMetaFields, type Category } from '@enjaz/core/categories';
import type { ListingTranslations, TestimonialTranslations } from '@enjaz/core';
import { useI18n } from '@/i18n/client';
import { catText } from '@/i18n/format';

type Values = Record<string, string | string[]> | undefined;
type Errors = Record<string, string>;

const LANGS = [
  { code: 'en', label: 'langEn', dir: 'ltr' as const },
  { code: 'ar', label: 'langAr', dir: 'rtl' as const },
] as const;

/** Optional English and Arabic versions of a listing's text. */
export function ListingTranslationFields({
  category, existing, values, errors,
}: { category: Category; existing?: ListingTranslations; values: Values; errors: Errors }) {
  const { d } = useI18n();
  const t = d.translation;
  const ct = catText(d, category);
  const metaFields = translatableMetaFields(category);
  const val = (key: string, fallback = '') => (values?.[key] as string | undefined) ?? fallback;

  return (
    <fieldset className="group">
      <legend>{t.legend}</legend>
      <p className="hint" style={{ marginTop: -6 }}>{t.hint} {t.listingExtra}</p>

      {LANGS.map(({ code, label, dir }) => {
        const tr = existing?.[code];
        const filled = Boolean(tr && Object.keys(tr).length) || Object.keys(errors).some((k) => k.startsWith(`tr_${code}_`));
        const field = (k: string, text: string, fallback: string | undefined, kind: 'input' | 'textarea' = 'input', max?: number) => {
          const key = `tr_${code}_${k}`;
          return (
            <label className="field" key={key}>
              <span>{text}</span>
              {kind === 'textarea' ? (
                <textarea name={key} rows={4} maxLength={max} dir={dir} lang={code} defaultValue={val(key, fallback ?? '')} />
              ) : (
                <input name={key} maxLength={max} dir={dir} lang={code} defaultValue={val(key, fallback ?? '')} />
              )}
              {errors[key] && <em className="field-error">{errors[key]}</em>}
            </label>
          );
        };
        return (
          <details className="lang-block" key={code} open={filled}>
            <summary>{t[label]}{filled && <span className="pill pill-ok" style={{ marginInlineStart: 10 }}>{t.filled}</span>}</summary>
            <div className="lang-fields">
              {field('title', t.name, tr?.title, 'input', 160)}
              {field('location', t.location, tr?.location, 'input', 120)}
              {field('summary', t.summary, tr?.summary, 'input', 200)}
              {field('description', t.description, tr?.description, 'textarea', 5000)}
              {metaFields.map((f) => field(`meta_${f.key}`, ct.fields[f.key]?.label ?? f.label, tr?.meta?.[f.key], 'input', 200))}
            </div>
          </details>
        );
      })}
    </fieldset>
  );
}

/** Optional English and Arabic versions of a testimonial. The customer's name is never translated. */
export function TestimonialTranslationFields({
  existing, values, errors,
}: { existing?: TestimonialTranslations; values: Values; errors: Errors }) {
  const { d } = useI18n();
  const t = d.translation;
  const val = (key: string, fallback = '') => (values?.[key] as string | undefined) ?? fallback;
  return (
    <fieldset className="group">
      <legend>{t.legend}</legend>
      <p className="hint" style={{ marginTop: -6 }}>{t.hint} {t.testimonialExtra}</p>
      {LANGS.map(({ code, label, dir }) => {
        const tr = existing?.[code];
        const filled = Boolean(tr && Object.keys(tr).length) || Object.keys(errors).some((k) => k.startsWith(`tr_${code}_`));
        const kq = `tr_${code}_quote`;
        const ko = `tr_${code}_origin`;
        return (
          <details className="lang-block" key={code} open={filled}>
            <summary>{t[label]}{filled && <span className="pill pill-ok" style={{ marginInlineStart: 10 }}>{t.filled}</span>}</summary>
            <div className="lang-fields">
              <label className="field">
                <span>{t.origin}</span>
                <input name={ko} maxLength={100} dir={dir} lang={code} defaultValue={val(ko, tr?.origin ?? '')} />
                {errors[ko] && <em className="field-error">{errors[ko]}</em>}
              </label>
              <label className="field">
                <span>{t.quote}</span>
                <textarea name={kq} rows={4} maxLength={600} dir={dir} lang={code} defaultValue={val(kq, tr?.quote ?? '')} />
                {errors[kq] && <em className="field-error">{errors[kq]}</em>}
              </label>
            </div>
          </details>
        );
      })}
    </fieldset>
  );
}
