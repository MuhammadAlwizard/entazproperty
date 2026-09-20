'use client';

import { WarningCircle } from '@phosphor-icons/react';
import { useI18n } from '@/i18n/client';

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  const { d } = useI18n();
  return (
    <div className="empty-state">
      <WarningCircle size={40} aria-hidden />
      <h2>{d.errorPage.title}</h2>
      <p className="muted">{d.errorPage.text}</p>
      <button className="btn btn-primary" onClick={reset}>{d.errorPage.retry}</button>
    </div>
  );
}
