'use client';

import { useActionState } from 'react';
import type { Settings } from '@enjaz/core';
import { MAX_HERO_IMAGES } from '@enjaz/core/categories';
import type { FormState } from '@/lib/form';
import { ImageUploader } from '@/components/ImageUploader';
import { SubmitButton } from '@/components/SubmitButton';
import { useI18n } from '@/i18n/client';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function SettingsForm({ settings, action }: { settings: Settings; action: Action }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const t = d.settings;
  const err = state.errors ?? {};
  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}

      <fieldset className="group">
        <legend>{t.contact.legend}</legend>
        <label className="field">
          <span>{t.contact.whatsapp}</span>
          <textarea name="whatsapp" rows={4} inputMode="tel" dir="ltr" defaultValue={settings.whatsapp} placeholder={'+62 812 3456 7890\n+62 813 3456 7890'} aria-invalid={!!err.whatsapp} />
          <small className="hint">{t.contact.whatsappHint}</small>
          {err.whatsapp && <em className="field-error">{err.whatsapp}</em>}
        </label>
        <label className="field">
          <span>{t.contact.email}</span>
          <input name="email" type="email" dir="ltr" defaultValue={settings.email} />
          {err.email && <em className="field-error">{err.email}</em>}
        </label>
        <label className="field">
          <span>{t.contact.instagram}</span>
          <input name="instagram" dir="ltr" defaultValue={settings.instagram} placeholder="@enjazinstan" />
          {err.instagram && <em className="field-error">{err.instagram}</em>}
        </label>
        <label className="field">
          <span>{t.contact.address}</span>
          <textarea name="address" rows={3} maxLength={300} defaultValue={settings.address} />
          <small className="hint">{t.contact.addressHint}</small>
          {err.address && <em className="field-error">{err.address}</em>}
        </label>
        <label className="field">
          <span>{t.contact.mapsUrl}</span>
          <input name="mapsUrl" type="url" dir="ltr" maxLength={500} defaultValue={settings.mapsUrl} placeholder="https://maps.app.goo.gl/..." />
          <small className="hint">{t.contact.mapsHint}</small>
          {err.mapsUrl && <em className="field-error">{err.mapsUrl}</em>}
        </label>
      </fieldset>

      <fieldset className="group">
        <legend>{t.hero.legend}</legend>
        <p className="hint" style={{ marginTop: -6 }}>{t.hero.hint}</p>
        <ImageUploader
          name="heroImages"
          initial={settings.heroImages.split('\n').filter(Boolean)}
          max={MAX_HERO_IMAGES}
          maxWidth={1920}
          firstLabel="main"
          error={err.heroImages}
        />
      </fieldset>

      <fieldset className="group">
        <legend>{t.heroMobile.legend}</legend>
        <p className="hint" style={{ marginTop: -6 }}>{t.heroMobile.hint}</p>
        <ImageUploader
          name="heroImagesMobile"
          initial={settings.heroImagesMobile.split('\n').filter(Boolean)}
          max={MAX_HERO_IMAGES}
          maxWidth={1080}
          firstLabel="main"
          error={err.heroImagesMobile}
        />
      </fieldset>

      <div className="form-actions"><SubmitButton>{t.save}</SubmitButton></div>
    </form>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const t = d.settings.password;
  const err = state.errors ?? {};
  return (
    <form action={formAction} className="form-card" autoComplete="off">
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}
      <fieldset className="group">
        <legend>{t.legend}</legend>
        <label className="field">
          <span>{t.current}</span>
          <input name="current" type="password" dir="ltr" autoComplete="current-password" required />
          {err.current && <em className="field-error">{err.current}</em>}
        </label>
        <label className="field">
          <span>{t.next}</span>
          <input name="next" type="password" dir="ltr" autoComplete="new-password" minLength={12} required />
          <small className="hint">{t.hint}</small>
          {err.next && <em className="field-error">{err.next}</em>}
        </label>
        <label className="field">
          <span>{t.confirm}</span>
          <input name="confirm" type="password" dir="ltr" autoComplete="new-password" required />
          {err.confirm && <em className="field-error">{err.confirm}</em>}
        </label>
      </fieldset>
      <div className="form-actions"><SubmitButton>{t.submit}</SubmitButton></div>
    </form>
  );
}

export function EmailForm({ action, current }: { action: Action; current: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const { d } = useI18n();
  const t = d.settings.email;
  const err = state.errors ?? {};
  return (
    <form action={formAction} className="form-card" autoComplete="off">
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}
      <fieldset className="group">
        <legend>{t.legend}</legend>
        <p className="muted small">{t.current} <strong dir="ltr">{current}</strong></p>
        <label className="field">
          <span>{t.newEmail}</span>
          <input name="email" type="email" dir="ltr" autoComplete="off" maxLength={200} required />
          {err.email && <em className="field-error">{err.email}</em>}
        </label>
        <label className="field">
          <span>{t.password}</span>
          <input name="password" type="password" dir="ltr" autoComplete="current-password" required />
          <small className="hint">{t.hint}</small>
          {err.password && <em className="field-error">{err.password}</em>}
        </label>
      </fieldset>
      <div className="form-actions"><SubmitButton>{t.submit}</SubmitButton></div>
    </form>
  );
}
