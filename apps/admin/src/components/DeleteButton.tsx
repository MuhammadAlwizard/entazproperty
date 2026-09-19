'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

function Confirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-danger-text" disabled={pending}>{pending ? 'Menghapus...' : label}</button>;
}

/** Two-step delete: first click asks, second click does it. Styled as red text, not a solid red block. */
export function DeleteButton({ action, what }: { action: () => Promise<void>; what: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return <button type="button" className="btn-danger-text" onClick={() => setAsking(true)}>Hapus {what}</button>;
  }
  return (
    <form action={action} className="inline-confirm">
      <span>Hapus {what} ini secara permanen?</span>
      <Confirm label="Ya, hapus" />
      <button type="button" className="btn-text" onClick={() => setAsking(false)}>Batal</button>
    </form>
  );
}
