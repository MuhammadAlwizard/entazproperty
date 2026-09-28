'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadSimple } from '@phosphor-icons/react';
import type { Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/types';

type Props = { token: string; locale: Locale; t: Dict['booking']['proof']; label?: string };

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Big photos are shrunk in the browser first (longest side 2000 px, JPEG): a phone screenshot stays readable and
 * the upload stays small on a weak connection. PDFs and small images are sent as they are.
 */
async function prepare(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size < 1_500_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // unusual formats: let the server decide
  }
}

export function ProofUpload({ token, locale, t, label }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function send(file: File) {
    setError('');
    setBusy(true);
    try {
      const body = await prepare(file);
      if (body.size > MAX_BYTES) { setError(t.tooLarge); return; }
      const fd = new FormData();
      fd.set('token', token);
      fd.set('file', body, file.name);
      const res = await fetch(`/api/bukti?lang=${locale}`, { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) { setError(data.error || t.failed); return; }
      setDone(true);
      router.refresh(); // the page now shows "proof received"
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="proof-upload">
      <input
        ref={input} id="proof-file" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f); }} disabled={busy}
      />
      <label htmlFor="proof-file" className={`btn btn-gold ${busy ? 'is-busy' : ''}`} aria-disabled={busy}>
        <UploadSimple size={20} weight="bold" aria-hidden /> {busy ? t.sending : (label ?? t.choose)}
      </label>
      <small className="order-small">{t.hint}</small>
      <p aria-live="polite" className={error ? 'proof-error' : 'proof-ok'}>{error || (done ? t.sent : '')}</p>
    </div>
  );
}
