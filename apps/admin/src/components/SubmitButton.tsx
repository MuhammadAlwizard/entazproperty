'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children, pendingText = 'Menyimpan...' }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? pendingText : children}</button>;
}
