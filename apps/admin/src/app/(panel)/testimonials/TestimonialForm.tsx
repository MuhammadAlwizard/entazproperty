'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { Testimonial } from '@enjaz/core';
import type { FormState } from '@/lib/form';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUploader } from '@/components/ImageUploader';
import { TestimonialTranslationFields } from '@/components/TranslationFields';
import { useI18n } from '@/i18n/client';
import { fill } from '@/i18n/format';

type Props = { item?: Testimonial; action: (prev: FormState, fd: FormData) => Promise<FormState> };

export function TestimonialForm({ item, action }: Props) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const f = d.testimonials.form;
  const err = state.errors ?? {};
  const v = (k: string, fb = '') => (state.values?.[k] as string | undefined) ?? fb;

  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      <fieldset className="group">
        <legend>{f.legend}</legend>
        <label className="field">
          <span>{f.name}</span>
          <input name="name" required maxLength={80} defaultValue={v('name', item?.name)} />
          {err.name && <em className="field-error">{err.name}</em>}
        </label>
        <label className="field">
          <span>{f.origin}</span>
          <input name="origin" maxLength={100} defaultValue={v('origin', item?.origin)} placeholder={f.originPlaceholder} />
          {err.origin && <em className="field-error">{err.origin}</em>}
        </label>
        <label className="field">
          <span>{f.quote}</span>
          <textarea name="quote" rows={5} required maxLength={600} defaultValue={v('quote', item?.quote)} />
          <small className="hint">{f.quoteHint}</small>
          {err.quote && <em className="field-error">{err.quote}</em>}
        </label>
        <div className="field">
          <span>{f.photo}</span>
          <ImageUploader
            name="photo"
            initial={(v('photo', item?.photo ?? '') ? [v('photo', item?.photo ?? '')] : [])}
            max={1}
            maxWidth={480}
            error={err.photo}
          />
          <small className="hint">{f.photoHint}</small>
        </div>
        <label className="field">
          <span>{f.rating}</span>
          <select name="rating" defaultValue={v('rating', String(item?.rating ?? 5))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{fill(d.testimonials.stars, { n })}</option>)}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={state.values ? state.values.published === 'on' : (item?.published ?? true)} />
          <span>{f.published}</span>
        </label>
      </fieldset>
      <TestimonialTranslationFields existing={item?.translations} values={state.values} errors={err} />

      <div className="form-actions">
        <SubmitButton>{f.save}</SubmitButton>
        <Link href="/testimonials" className="btn-text">{d.common.cancel}</Link>
      </div>
    </form>
  );
}
