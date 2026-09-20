'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImageSquare, Star, X } from '@phosphor-icons/react';
import { useI18n } from '@/i18n/client';
import { fill } from '@/i18n/format';

type Props = {
  /** Form field name; one hidden input per photo is submitted under this name, in display order */
  name: string;
  initial: string[];
  max: number;
  error?: string;
  /** Photos wider than this are shrunk in the browser before upload */
  maxWidth?: number;
  /** Which word the first photo gets: 'cover' (listings) or 'main' (hero photos) */
  firstLabel?: 'cover' | 'main';
};

/**
 * Shrinks big photos in the browser so a 6 MB phone picture doesn't end up
 * as a 6 MB hero image. Falls back to the original file if anything fails.
 */
async function shrink(file: File, maxWidth: number): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxWidth / bitmap.width);
    // Always re-encode, even small photos: drawing to a canvas applies the camera's rotation to the
    // pixels and drops all metadata (GPS position, camera model) before the file leaves this browser.
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85));
    if (!blob || blob.type !== 'image/webp') return file; // browser can't encode WebP: server still strips JPEG metadata
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export function ImageUploader({ name, initial, max, error, maxWidth = 1600, firstLabel = 'cover' }: Props) {
  const { d } = useI18n();
  const u = d.uploader;
  const label = u[firstLabel];
  const [images, setImages] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const input = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setProblem('');
    let next = max === 1 ? [] : [...images];
    for (const original of Array.from(files)) {
      if (next.length >= max) { setProblem(fill(u.maxReached, { max })); break; }
      const file = await shrink(original, maxWidth);
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) { setProblem(json.error ?? u.failed); continue; }
        next = [...next, json.url];
      } catch {
        setProblem(u.offline);
      }
    }
    setImages(next);
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  const remove = (i: number) => setImages((a) => a.filter((_, idx) => idx !== i));
  const makeFirst = (i: number) => setImages((a) => [a[i], ...a.filter((_, idx) => idx !== i)]);
  const move = (i: number, dir: -1 | 1) =>
    setImages((a) => {
      const j = i + dir;
      if (j < 0 || j >= a.length) return a;
      const copy = [...a];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div className="uploader">
      {images.map((src, i) => (
        <input key={`${i}-${src}`} type="hidden" name={name} value={src} />
      ))}

      <ul className="thumbs">
        {images.map((src, i) => (
          <li key={`${i}-${src}`} className="thumb">
            <img src={src} alt={fill(u.photo, { n: i + 1 })} />
            {i === 0 && max > 1 && <span className="thumb-cover">{label}</span>}
            {max > 1 && (
              <div className="thumb-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={fill(u.earlier, { n: i + 1 })}><ArrowLeft size={14} aria-hidden /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={fill(u.later, { n: i + 1 })}><ArrowRight size={14} aria-hidden /></button>
                {i > 0 && <button type="button" onClick={() => makeFirst(i)} aria-label={fill(u.makeFirst, { n: i + 1, label: label.toLowerCase() })} title={fill(u.makeFirstTitle, { label: label.toLowerCase() })}><Star size={14} aria-hidden /></button>}
                <button type="button" onClick={() => remove(i)} aria-label={fill(u.remove, { n: i + 1 })} className="thumb-remove"><X size={14} aria-hidden /></button>
              </div>
            )}
            {max === 1 && (
              <div className="thumb-actions">
                <button type="button" onClick={() => remove(i)} aria-label={u.removeOne} className="thumb-remove"><X size={14} aria-hidden /></button>
              </div>
            )}
          </li>
        ))}
        {images.length < max || max === 1 ? (
          <li>
            <button type="button" className="thumb-add" onClick={() => input.current?.click()} disabled={busy}>
              <ImageSquare size={28} aria-hidden />
              <span>{busy ? u.uploading : max === 1 && images.length ? u.replace : u.add}</span>
            </button>
          </li>
        ) : null}
      </ul>

      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} hidden onChange={(e) => onFiles(e.target.files)} />
      <p className="hint">
        {fill(u.hint, { width: maxWidth })}
        {max > 1 ? ` ${fill(u.hintOrder, { label: label.toLowerCase() })}` : ''}
      </p>
      {(problem || error) && <p className="field-error" role="alert">{problem || error}</p>}
    </div>
  );
}
