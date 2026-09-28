import { bookingAmount, bookingsForExport, CATEGORIES, daysBetween, isIsoDate, logAudit, wibRange } from '@enjaz/core';
import { getClientIp, getSession } from '@/lib/auth';
import { buildXlsx, type CellValue } from '@/lib/xlsx';
import { getI18n } from '@/i18n/server';
import { catText } from '@/i18n/format';

// Bookings in a date range as a real .xlsx file (not CSV: Excel set to Indonesian splits CSV on semicolons and
// shows everything in one column). Holds customers' personal data, so admins only, and every download is logged.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (session.mustChangePassword) return new Response('Forbidden', { status: 403 });
  const { d } = await getI18n();
  const t = d.reports;
  const c = t.cols;

  const url = new URL(req.url);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const basis = url.searchParams.get('basis') === 'paid' ? 'paid' : 'created';
  if (!isIsoDate(from) || !isIsoDate(to) || to < from || daysBetween(from, to) > 366) {
    return new Response(t.exportBad, { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const rows = await bookingsForExport(wibRange(from).from, wibRange(to).to, basis);

  // Timestamps are shown as Indonesian wall-clock time; calendar days (start, end) are already local.
  const wib = (iso: string | null): CellValue => (iso ? new Date(new Date(iso).getTime() + 7 * 3600_000) : null);
  const day = (iso: string | null): CellValue => (iso ? new Date(`${iso}T00:00:00Z`) : null);

  const bookingsSheet = {
    name: t.sheetBookings,
    columns: [
      { header: c.code, width: 18 }, { header: c.created, type: 'datetime' as const, width: 17 }, { header: c.source, width: 14 },
      { header: c.status, width: 16 }, { header: c.name, width: 24 }, { header: c.phone, width: 16 }, { header: c.email, width: 24 },
      { header: c.category, width: 14 }, { header: c.listing, width: 28 }, { header: c.start, type: 'date' as const, width: 12 },
      { header: c.end, type: 'date' as const, width: 12 }, { header: c.guests, type: 'number' as const, width: 12 },
      { header: c.unitPrice, type: 'money' as const, width: 14 }, { header: c.units, type: 'number' as const, width: 9 },
      { header: c.extras, type: 'money' as const, width: 15 }, { header: c.total, type: 'money' as const, width: 15 },
      { header: c.paidAt, type: 'datetime' as const, width: 17 }, { header: c.note, width: 30 }, { header: c.adminNote, width: 30 },
    ],
    rows: rows.map((b) => [
      b.code, wib(b.createdAt), d.bookings.sources[b.source], d.bookings.statuses[b.status], b.name, b.phone, b.email,
      catText(d, b.category).short, b.listingTitle, day(b.startDate), day(b.endDate),
      b.category === 'mobil' || b.category === 'motor' ? null : b.guests,
      b.unitPrice, b.units, b.extras.reduce((s, x) => s + x.amount, 0) || null, bookingAmount(b),
      wib(b.paidAt), b.note, b.adminNote,
    ]),
  };

  // Summary: only what was actually paid counts as revenue.
  const paid = rows.filter((b) => b.status === 'paid' || b.status === 'done');
  const sum = (list: typeof paid) => list.reduce((s, b) => s + bookingAmount(b), 0);
  const group = (label: string, list: typeof paid): CellValue[] => [label, list.length, sum(list)];
  const summarySheet = {
    name: t.sheetSummary,
    columns: [{ header: c.group, width: 40 }, { header: c.paidCount, type: 'number' as const, width: 14 }, { header: c.revenue, type: 'money' as const, width: 16 }],
    rows: [
      ...CATEGORIES.map((cat) => group(catText(d, cat).label, paid.filter((b) => b.category === cat))),
      [null, null, null],
      group(t.web, paid.filter((b) => b.source === 'web')),
      group(t.manual, paid.filter((b) => b.source !== 'web')),
      [null, null, null],
      group(t.totalRow, paid),
    ],
  };

  const file = buildXlsx([bookingsSheet, summarySheet]);
  await logAudit({ email: session.email, action: 'bookings.export', detail: { from, to, basis, rows: rows.length }, ip: await getClientIp() });
  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="booking-${from}-${to}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
