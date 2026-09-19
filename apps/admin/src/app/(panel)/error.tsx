'use client';

import { WarningCircle } from '@phosphor-icons/react';

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty-state">
      <WarningCircle size={40} aria-hidden />
      <h2>Halaman ini belum bisa dibuka</h2>
      <p className="muted">Ada gangguan sementara. Data kamu aman. Coba muat ulang.</p>
      <button className="btn btn-primary" onClick={reset}>Coba lagi</button>
    </div>
  );
}
