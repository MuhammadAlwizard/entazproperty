'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

function Confirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-danger-text" disabled={pending}>{pending ? 'Menghapus...' : label}</button>;
}

/**
 * Two-step delete: first click asks, second click does it. Styled as red text, not a solid red block.
 * `compact` is for table rows: short labels, and `what` names the item for screen readers.
 */
export function DeleteButton({ action, what, compact = false }: { action: () => Promise<void>; what: string; compact?: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="btn-danger-text" onClick={() => setAsking(true)} aria-label={compact ? `Hapus ${what}` : undefined}>
        {compact ? 'Hapus' : `Hapus ${what}`}
      </button>
    );
  }
  return (
    <form action={action} className="inline-confirm">
      <span>{compact ? 'Yakin?' : `Hapus ${what} ini secara permanen?`}</span>
      <Confirm label="Ya, hapus" />
      <button type="button" className="btn-text" onClick={() => setAsking(false)}>Batal</button>
    </form>
  );
}
