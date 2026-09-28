import { NextResponse, type NextRequest } from 'next/server';
import { getBookingByToken, MAX_PROOF_BYTES, saveProof } from '@enjaz/core';
import { getDict, isLocale } from '@/i18n';

// Transfer proof upload from the customer's booking page (/pesanan/<token>).
// A route handler, not a Server Action: actions are capped at 1 MB for the whole site, and raising that cap for
// every form would only help spammers. Here the size is checked before the body is read.

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  const langParam = req.nextUrl.searchParams.get('lang') ?? 'id';
  const m = getDict(isLocale(langParam) ? langParam : 'id').booking.proof;

  // Only our own pages post here.
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) return json({ error: m.failed }, 403);

  const length = Number(req.headers.get('content-length') ?? 0);
  if (!length || length > MAX_PROOF_BYTES + 64 * 1024) return json({ error: m.tooLarge }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: m.failed }, 400);
  }
  const token = String(form.get('token') ?? '');
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: m.badFormat }, 400);

  const booking = await getBookingByToken(token);
  if (!booking) return json({ error: m.failed }, 404);
  if (booking.status !== 'awaiting_payment' && booking.status !== 'payment_review') return json({ error: m.closed }, 409);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
  const result = await saveProof(booking.id, Buffer.from(await file.arrayBuffer()), ip, m);
  if (!result.ok) return json({ error: result.error }, 400);
  return json({ ok: true });
}
