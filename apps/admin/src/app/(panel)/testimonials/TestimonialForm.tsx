'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { Testimonial } from '@enjaz/core';
import type { FormState } from '@/lib/form';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUploader } from '@/components/ImageUploader';

type Props = { item?: Testimonial; action: (prev: FormState, fd: FormData) => Promise<FormState> };

export function TestimonialForm({ item, action }: Props) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const err = state.errors ?? {};
  const v = (k: string, fb = '') => (state.values?.[k] as string | undefined) ?? fb;

  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      <fieldset className="group">
        <legend>Testimoni</legend>
        <label className="field">
          <span>Nama pelanggan</span>
          <input name="name" required maxLength={80} defaultValue={v('name', item?.name)} />
          {err.name && <em className="field-error">{err.name}</em>}
        </label>
        <label className="field">
          <span>Keterangan (opsional)</span>
          <input name="origin" maxLength={100} defaultValue={v('origin', item?.origin)} placeholder="Menyewa Villa Kamboja, Lembang" />
          {err.origin && <em className="field-error">{err.origin}</em>}
        </label>
        <label className="field">
          <span>Isi testimoni</span>
          <textarea name="quote" rows={5} required maxLength={600} defaultValue={v('quote', item?.quote)} />
          <small className="hint">Tulis apa adanya dari pelanggan. Testimoni palsu bisa merugikan kepercayaan dan melanggar aturan iklan.</small>
          {err.quote && <em className="field-error">{err.quote}</em>}
        </label>
        <div className="field">
          <span>Foto pelanggan (opsional)</span>
          <ImageUploader
            name="photo"
            initial={(v('photo', item?.photo ?? '') ? [v('photo', item?.photo ?? '')] : [])}
            max={1}
            maxWidth={480}
            error={err.photo}
          />
          <small className="hint">Tampil sebagai foto bulat di kartu. Kalau kosong, kartu memakai huruf awal nama. Pakai foto hanya kalau pelanggan setuju.</small>
        </div>
        <label className="field">
          <span>Rating</span>
          <select name="rating" defaultValue={v('rating', String(item?.rating ?? 5))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} dari 5</option>)}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={state.values ? state.values.published === 'on' : (item?.published ?? true)} />
          <span>Tampilkan di website</span>
        </label>
      </fieldset>
      <div className="form-actions">
        <SubmitButton>Simpan testimoni</SubmitButton>
        <Link href="/testimonials" className="btn-text">Batal</Link>
      </div>
    </form>
  );
}
