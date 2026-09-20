'use client';

import { useFormStatus } from 'react-dom';
import { useI18n } from '@/i18n/client';

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  const { d } = useI18n();
  return <button className="btn btn-primary" disabled={pending}>{pending ? (pendingText ?? d.common.saving) : children}</button>;
}
