'use client';

import { Printer } from '@phosphor-icons/react';

/** Opens the browser's print dialog, where "Save as PDF" is one of the printers (also on phones). */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-gold no-print" onClick={() => window.print()}>
      <Printer size={20} weight="bold" aria-hidden /> {label}
    </button>
  );
}
