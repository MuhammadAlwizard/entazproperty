'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, CATEGORY_CONFIG, MAX_LISTING_IMAGES, type Category } from '@enjaz/core/categories';
import type { Listing } from '@enjaz/core';
import type { FormState } from '@/lib/form';
import { ImageUploader } from '@/components/ImageUploader';
import { SubmitButton } from '@/components/SubmitButton';
import { ListingTranslationFields } from '@/components/TranslationFields';

type Props = {
  listing?: Listing;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
};

export function ListingForm({ listing, action }: Props) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const [category, setCategory] = useState<Category>((state.values?.category as Category) ?? listing?.category ?? 'villa');
  const cfg = CATEGORY_CONFIG[category];
  const err = state.errors ?? {};
  const v = (key: string, fallback = '') => (state.values?.[key] as string | undefined) ?? fallback;
  const sameCategory = listing?.category === category;
  const initialImages = (state.values?.images as string[] | undefined) ?? listing?.images ?? [];

  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}

      <fieldset className="group">
        <legend>Dasar</legend>

        <label className="field">
          <span>Kategori</span>
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Nama listing</span>
          <input name="title" required maxLength={120} defaultValue={v('title', listing?.title)} aria-invalid={!!err.title} />
          {err.title && <em className="field-error">{err.title}</em>}
        </label>

        <label className="field">
          <span>Harga per {cfg.priceUnit} (Rp)</span>
          <input name="price" inputMode="numeric" required defaultValue={v('price', listing ? String(listing.price) : '')} placeholder="1200000" aria-invalid={!!err.price} />
          {err.price && <em className="field-error">{err.price}</em>}
        </label>
      </fieldset>

      <fieldset className="group group-highlight">
        <legend>Lokasi</legend>

        <label className="field">
          <span>{cfg.locationLabel}{cfg.locationRequired ? ' (wajib)' : ''}</span>
          <input
            name="location"
            required={cfg.locationRequired}
            maxLength={120}
            defaultValue={v('location', listing?.location)}
            placeholder={category === 'villa' ? 'Lembang, Bandung Barat' : ''}
            aria-invalid={!!err.location}
          />
          <small className="hint">{cfg.locationHint}</small>
          {err.location && <em className="field-error">{err.location}</em>}
        </label>

        {category === 'villa' && (
          <>
            <label className="field">
              <span>Alamat lengkap (opsional)</span>
              <input name="address" maxLength={300} defaultValue={v('address', listing?.address)} placeholder="Jl. Raya Lembang No. 12" />
              <small className="hint">Dipakai untuk peta di halaman villa. Kalau kosong, peta memakai lokasi di atas.</small>
              {err.address && <em className="field-error">{err.address}</em>}
            </label>
            <label className="field">
              <span>Link Google Maps (opsional)</span>
              <input name="mapsUrl" type="url" maxLength={500} defaultValue={v('mapsUrl', listing?.mapsUrl)} placeholder="https://maps.app.goo.gl/..." aria-invalid={!!err.mapsUrl} />
              <small className="hint">Buka Google Maps, cari villa, tekan Bagikan, lalu salin link-nya ke sini.</small>
              {err.mapsUrl && <em className="field-error">{err.mapsUrl}</em>}
            </label>
          </>
        )}
      </fieldset>

      <fieldset className="group">
        <legend>Detail {cfg.label}</legend>
        <div className="grid-2">
          {cfg.fields.map((f) => {
            const key = `meta_${f.key}`;
            const initial = sameCategory ? listing?.meta[f.key] ?? '' : '';
            return (
              <label className={`field ${f.type === 'text' && f.key !== 'durasi' ? 'span-2' : ''}`} key={`${category}-${f.key}`}>
                <span>{f.label}{f.suffix ? ` (${f.suffix})` : ''}</span>
                {f.type === 'select' ? (
                  <select name={key} defaultValue={v(key, initial)}>
                    <option value="">Pilih</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input name={key} inputMode={f.type === 'number' ? 'numeric' : undefined} defaultValue={v(key, initial)} placeholder={f.placeholder} />
                )}
                {err[key] && <em className="field-error">{err[key]}</em>}
              </label>
            );
          })}
        </div>

        <label className="field">
          <span>Ringkasan singkat</span>
          <input name="summary" maxLength={200} defaultValue={v('summary', listing?.summary)} placeholder="Satu kalimat yang muncul di kartu dan hasil pencarian" />
          {err.summary && <em className="field-error">{err.summary}</em>}
        </label>

        <label className="field">
          <span>Deskripsi</span>
          <textarea name="description" rows={6} maxLength={5000} defaultValue={v('description', listing?.description)} />
          <small className="hint">Pisahkan paragraf dengan satu baris kosong.</small>
          {err.description && <em className="field-error">{err.description}</em>}
        </label>
      </fieldset>

      <ListingTranslationFields category={category} existing={listing?.translations} values={state.values} errors={err} />

      <fieldset className="group">
        <legend>Foto</legend>
        <ImageUploader name="images" initial={initialImages} max={MAX_LISTING_IMAGES} error={err.images} />
      </fieldset>

      <fieldset className="group">
        <legend>Tampilan di website</legend>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={state.values ? state.values.published === 'on' : (listing?.published ?? true)} />
          <span>Tampilkan di website<small>Kalau dimatikan, listing jadi draft dan tidak terlihat pengunjung.</small></span>
        </label>
        <label className="check">
          <input type="checkbox" name="featured" defaultChecked={state.values ? state.values.featured === 'on' : (listing?.featured ?? false)} />
          <span>Jadikan unggulan<small>Unggulan muncul paling depan di beranda.</small></span>
        </label>
      </fieldset>

      <div className="form-actions">
        <SubmitButton>{listing ? 'Simpan perubahan' : 'Simpan listing'}</SubmitButton>
        <Link href="/listings" className="btn-text">Batal</Link>
      </div>
    </form>
  );
}
