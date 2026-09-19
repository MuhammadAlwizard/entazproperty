'use client';

import { useActionState } from 'react';
import type { Settings } from '@enjaz/core';
import { MAX_HERO_IMAGES } from '@enjaz/core/categories';
import type { FormState } from '@/lib/form';
import { ImageUploader } from '@/components/ImageUploader';
import { SubmitButton } from '@/components/SubmitButton';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function SettingsForm({ settings, action }: { settings: Settings; action: Action }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const err = state.errors ?? {};
  return (
    <form action={formAction} className="form-card">
      {state.formError && <p className="notice notice-error" role="alert">{state.formError}</p>}
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}

      <fieldset className="group">
        <legend>Kontak</legend>
        <label className="field">
          <span>Nomor WhatsApp</span>
          <textarea name="whatsapp" rows={4} inputMode="tel" defaultValue={settings.whatsapp} placeholder={'+62 812 3456 7890\n+62 813 3456 7890'} aria-invalid={!!err.whatsapp} />
          <small className="hint">Satu nomor per baris, maksimal 5. Nomor paling atas dipakai untuk semua tombol pesan di website, semuanya tampil di bagian kontak. Kalau kosong, tombol tidak tampil.</small>
          {err.whatsapp && <em className="field-error">{err.whatsapp}</em>}
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" defaultValue={settings.email} />
          {err.email && <em className="field-error">{err.email}</em>}
        </label>
        <label className="field">
          <span>Instagram</span>
          <input name="instagram" defaultValue={settings.instagram} placeholder="@enjazinstan" />
          {err.instagram && <em className="field-error">{err.instagram}</em>}
        </label>
        <label className="field">
          <span>Alamat kantor</span>
          <textarea name="address" rows={3} maxLength={300} defaultValue={settings.address} />
          {err.address && <em className="field-error">{err.address}</em>}
        </label>
      </fieldset>

      <fieldset className="group">
        <legend>Foto hero beranda</legend>
        <p className="hint" style={{ marginTop: -6 }}>
          Foto besar di bagian paling atas beranda. Kalau lebih dari satu, foto berganti sendiri dengan efek memudar.
          Kalau hanya satu, foto diam. Gunakan foto lanskap (mendatar), teks di atasnya otomatis diberi lapisan gelap agar terbaca.
        </p>
        <ImageUploader
          name="heroImages"
          initial={settings.heroImages.split('\n').filter(Boolean)}
          max={MAX_HERO_IMAGES}
          maxWidth={1920}
          firstLabel="Utama"
          error={err.heroImages}
        />
      </fieldset>

      <div className="form-actions"><SubmitButton>Simpan pengaturan</SubmitButton></div>
    </form>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const err = state.errors ?? {};
  return (
    <form action={formAction} className="form-card" autoComplete="off">
      {state.ok && <p className="notice notice-ok" role="status">{state.ok}</p>}
      <fieldset className="group">
        <legend>Ganti password</legend>
        <label className="field">
          <span>Password saat ini</span>
          <input name="current" type="password" autoComplete="current-password" required />
          {err.current && <em className="field-error">{err.current}</em>}
        </label>
        <label className="field">
          <span>Password baru</span>
          <input name="next" type="password" autoComplete="new-password" minLength={12} required />
          <small className="hint">Minimal 12 karakter, jangan memuat bagian email, dan jangan kata yang mudah ditebak. Kalimat panjang lebih aman daripada kata rumit.</small>
          {err.next && <em className="field-error">{err.next}</em>}
        </label>
        <label className="field">
          <span>Ulangi password baru</span>
          <input name="confirm" type="password" autoComplete="new-password" required />
          {err.confirm && <em className="field-error">{err.confirm}</em>}
        </label>
      </fieldset>
      <div className="form-actions"><SubmitButton>Ganti password</SubmitButton></div>
    </form>
  );
}
