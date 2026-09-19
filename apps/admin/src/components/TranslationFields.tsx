'use client';

import { translatableMetaFields, type Category } from '@enjaz/core/categories';
import type { ListingTranslations, TestimonialTranslations } from '@enjaz/core';

type Values = Record<string, string | string[]> | undefined;
type Errors = Record<string, string>;

const LANGS = [
  { code: 'en', name: 'English (US)', dir: 'ltr' as const },
  { code: 'ar', name: 'العربية (Arab)', dir: 'rtl' as const },
];

const HINT = 'Kosongkan bagian yang tidak diterjemahkan. Bagian kosong tampil dalam bahasa Indonesia di website.';

/** Optional English and Arabic versions of a listing's text. */
export function ListingTranslationFields({
  category, existing, values, errors,
}: { category: Category; existing?: ListingTranslations; values: Values; errors: Errors }) {
  const metaFields = translatableMetaFields(category);
  const val = (key: string, fallback = '') => (values?.[key] as string | undefined) ?? fallback;

  return (
    <fieldset className="group">
      <legend>Terjemahan (opsional)</legend>
      <p className="hint" style={{ marginTop: -6 }}>{HINT} Nama tempat seperti Lembang atau Ubud boleh ditulis dengan ejaan bahasa tujuan.</p>

      {LANGS.map(({ code, name, dir }) => {
        const t = existing?.[code as 'en' | 'ar'];
        const filled = Boolean(t && Object.keys(t).length) || Object.keys(errors).some((k) => k.startsWith(`tr_${code}_`));
        const field = (k: string, label: string, fallback: string | undefined, kind: 'input' | 'textarea' = 'input', max?: number) => {
          const key = `tr_${code}_${k}`;
          return (
            <label className="field" key={key}>
              <span>{label}</span>
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
            <summary>{name}{filled && <span className="pill pill-ok" style={{ marginLeft: 10 }}>Terisi</span>}</summary>
            <div className="lang-fields">
              {field('title', 'Nama listing', t?.title, 'input', 160)}
              {field('location', 'Lokasi', t?.location, 'input', 120)}
              {field('summary', 'Ringkasan singkat', t?.summary, 'input', 200)}
              {field('description', 'Deskripsi', t?.description, 'textarea', 5000)}
              {metaFields.map((f) => field(`meta_${f.key}`, f.label, t?.meta?.[f.key], 'input', 200))}
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
  const val = (key: string, fallback = '') => (values?.[key] as string | undefined) ?? fallback;
  return (
    <fieldset className="group">
      <legend>Terjemahan (opsional)</legend>
      <p className="hint" style={{ marginTop: -6 }}>{HINT} Terjemahkan setia pada isi aslinya, jangan menambah atau mengubah pendapat pelanggan.</p>
      {LANGS.map(({ code, name, dir }) => {
        const t = existing?.[code as 'en' | 'ar'];
        const filled = Boolean(t && Object.keys(t).length) || Object.keys(errors).some((k) => k.startsWith(`tr_${code}_`));
        const kq = `tr_${code}_quote`;
        const ko = `tr_${code}_origin`;
        return (
          <details className="lang-block" key={code} open={filled}>
            <summary>{name}{filled && <span className="pill pill-ok" style={{ marginLeft: 10 }}>Terisi</span>}</summary>
            <div className="lang-fields">
              <label className="field">
                <span>Keterangan</span>
                <input name={ko} maxLength={100} dir={dir} lang={code} defaultValue={val(ko, t?.origin ?? '')} />
                {errors[ko] && <em className="field-error">{errors[ko]}</em>}
              </label>
              <label className="field">
                <span>Isi testimoni</span>
                <textarea name={kq} rows={4} maxLength={600} dir={dir} lang={code} defaultValue={val(kq, t?.quote ?? '')} />
                {errors[kq] && <em className="field-error">{errors[kq]}</em>}
              </label>
            </div>
          </details>
        );
      })}
    </fieldset>
  );
}
