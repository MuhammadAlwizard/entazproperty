import { readProof } from '@enjaz/core';
import { getSession } from '@/lib/auth';

// A customer's transfer proof, for signed-in admins only (it shows names and account numbers).
// Images open in the browser inside a sandbox; PDFs are downloaded, because browsers refuse to run their PDF viewer
// in a sandboxed response.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.mustChangePassword) return new Response('Not found', { status: 404 });
  const proof = await readProof((await ctx.params).id);
  if (!proof) return new Response('Not found', { status: 404 });
  const pdf = proof.ext === 'pdf';
  return new Response(new Uint8Array(proof.body), {
    headers: {
      'Content-Type': proof.mime,
      'Content-Length': String(proof.body.length),
      'Content-Disposition': `${pdf ? 'attachment' : 'inline'}; filename="bukti-transfer-${proof.bookingId}.${proof.ext}"`,
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
