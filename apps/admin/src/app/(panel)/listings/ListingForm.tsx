'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, CATEGORY_CONFIG, MAX_LISTING_IMAGES, type Category } from '@enjaz/core/categories';
import type { Listing } from '@enjaz/core';
import type { FormState } from '@/lib/form';
import { ImageUploader } from '@/components/ImageUploader';
import { SubmitButton } from '@/components/SubmitButton';
import { ListingTranslationFields } from '@/components/TranslationFields';
import { useI18n } from '@/i18n/client';
import { catText, fill } from '@/i18n/format';

type Props = {
  listing?: Listing;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
};

export function ListingForm({ listing, action }: Props) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const f = d.listingForm;
  const [category, setCategory] = useState<Category>((state.values?.category as Category) ?? listing?.category ?? 'villa');
  const cfg = CATEGORY_CONFIG[category];
  const ct = catText(d, category);
  const err = state.errors ?? {};
  const v = (key: string, fallback = '') => (state.values?.[key] as string | undefined) ?? fallback;
  const sameCategory = listing?.category === category;
  const initialImages = (state.values?.images as string[] | undefined) ?? listing?.images ?? [];

  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}

      <fieldset className="group">
        <legend>{f.basics}</legend>

        <label className="field">
          <span>{f.category}</span>
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{catText(d, c).label}</option>)}
          </select>
        </label>

        <label className="field">
          <span>{f.name}</span>
          <input name="title" required maxLength={120} defaultValue={v('title', listing?.title)} aria-invalid={!!err.title} />
          {err.title && <em className="field-error">{err.title}</em>}
        </label>

        <label className="field">
          <span>{fill(f.pricePer, { unit: ct.priceUnit })}</span>
          <input name="price" inputMode="numeric" dir="ltr" required defaultValue={v('price', listing ? String(listing.price) : '')} placeholder="1200000" aria-invalid={!!err.price} />
          {err.price && <em className="field-error">{err.price}</em>}
        </label>
      </fieldset>

      <fieldset className="group group-highlight">
        <legend>{f.location}</legend>

        <label className="field">
          <span>{ct.locationLabel}{cfg.locationRequired ? ` (${f.required})` : ''}</span>
          <input
            name="location"
            required={cfg.locationRequired}
            maxLength={120}
            defaultValue={v('location', listing?.location)}
            placeholder={category === 'villa' ? f.villaLocationPlaceholder : ''}
            aria-invalid={!!err.location}
          />
          <small className="hint">{ct.locationHint}</small>
          {err.location && <em className="field-error">{err.location}</em>}
        </label>

        {category === 'villa' && (
          <>
            <label className="field">
              <span>{f.address}</span>
              <input name="address" maxLength={300} defaultValue={v('address', listing?.address)} placeholder={f.addressPlaceholder} />
              <small className="hint">{f.addressHint}</small>
              {err.address && <em className="field-error">{err.address}</em>}
            </label>
            <label className="field">
              <span>{f.mapsUrl}</span>
              <input name="mapsUrl" type="url" dir="ltr" maxLength={500} defaultValue={v('mapsUrl', listing?.mapsUrl)} placeholder="https://maps.app.goo.gl/..." aria-invalid={!!err.mapsUrl} />
              <small className="hint">{f.mapsHint}</small>
              {err.mapsUrl && <em className="field-error">{err.mapsUrl}</em>}
            </label>
          </>
        )}
      </fieldset>

      <fieldset className="group">
        <legend>{fill(f.details, { label: ct.label })}</legend>
        <div className="grid-2">
          {cfg.fields.map((field) => {
            const key = `meta_${field.key}`;
            const initial = sameCategory ? listing?.meta[field.key] ?? '' : '';
            const words = ct.fields[field.key];
            const label = words?.label ?? field.label;
            const suffix = words?.suffix ?? field.suffix;
            return (
              <label className={`field ${field.type === 'text' && field.key !== 'durasi' ? 'span-2' : ''}`} key={`${category}-${field.key}`}>
                <span>{label}{suffix ? ` (${suffix})` : ''}</span>
                {field.type === 'select' ? (
                  <select name={key} defaultValue={v(key, initial)}>
                    <option value="">{f.choose}</option>
                    {field.options?.map((o) => <option key={o} value={o}>{words?.options?.[o] ?? o}</option>)}
                  </select>
                ) : (
                  <input name={key} inputMode={field.type === 'number' ? 'numeric' : undefined} dir={field.type === 'number' ? 'ltr' : undefined} defaultValue={v(key, initial)} placeholder={words?.placeholder ?? field.placeholder} />
                )}
                {err[key] && <em className="field-error">{err[key]}</em>}
              </label>
            );
          })}
        </div>

        <label className="field">
          <span>{f.summary}</span>
          <input name="summary" maxLength={200} defaultValue={v('summary', listing?.summary)} placeholder={f.summaryPlaceholder} />
          {err.summary && <em className="field-error">{err.summary}</em>}
        </label>

        <label className="field">
          <span>{f.description}</span>
          <textarea name="description" rows={6} maxLength={5000} defaultValue={v('description', listing?.description)} />
          <small className="hint">{f.descriptionHint}</small>
          {err.description && <em className="field-error">{err.description}</em>}
        </label>
      </fieldset>

      <ListingTranslationFields category={category} existing={listing?.translations} values={state.values} errors={err} />

      <fieldset className="group">
        <legend>{f.photos}</legend>
        <ImageUploader name="images" initial={initialImages} max={MAX_LISTING_IMAGES} error={err.images} />
      </fieldset>

      <fieldset className="group">
        <legend>{f.display}</legend>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={state.values ? state.values.published === 'on' : (listing?.published ?? true)} />
          <span>{f.published}<small>{f.publishedHint}</small></span>
        </label>
        <label className="check">
          <input type="checkbox" name="featured" defaultChecked={state.values ? state.values.featured === 'on' : (listing?.featured ?? false)} />
          <span>{f.featured}<small>{f.featuredHint}</small></span>
        </label>
      </fieldset>

      <div className="form-actions">
        <SubmitButton>{listing ? f.saveChanges : f.saveNew}</SubmitButton>
        <Link href="/listings" className="btn-text">{d.common.cancel}</Link>
      </div>
    </form>
  );
}
