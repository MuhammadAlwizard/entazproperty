'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useI18n } from '@/i18n/client';
import { fill } from '@/i18n/format';

function Confirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { d } = useI18n();
  return <button className="btn-danger-text" disabled={pending}>{pending ? d.delete.pending : label}</button>;
}

/**
 * Two-step delete: first click asks, second click does it. Styled as red text, not a solid red block.
 * `compact` is for table rows: short labels, and `name` names the item for screen readers.
 */
export function DeleteButton({
  action, kind, name = '', compact = false,
}: { action: () => Promise<void>; kind: 'listing' | 'testimonial'; name?: string; compact?: boolean }) {
  const [asking, setAsking] = useState(false);
  const { d } = useI18n();
  const t = d.delete;
  const words = t[kind];
  if (!asking) {
    return (
      <button type="button" className="btn-danger-text" onClick={() => setAsking(true)} aria-label={compact ? fill(words.aria, { name }) : undefined}>
        {compact ? t.button : words.button}
      </button>
    );
  }
  return (
    <form action={action} className="inline-confirm">
      <span>{compact ? t.ask : words.question}</span>
      <Confirm label={t.confirm} />
      <button type="button" className="btn-text" onClick={() => setAsking(false)}>{t.cancel}</button>
    </form>
  );
}
