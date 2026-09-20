'use client';

import { useI18n } from '@/i18n/client';

export default function Loading() {
  const { d } = useI18n();
  return (
    <div aria-busy="true" aria-label={d.errorPage.loading}>
      <div className="skeleton" style={{ width: 220, height: 34 }} />
      <div className="skeleton" style={{ width: '100%', height: 220, marginTop: 28 }} />
      <div className="skeleton" style={{ width: '100%', height: 120, marginTop: 16 }} />
    </div>
  );
}
