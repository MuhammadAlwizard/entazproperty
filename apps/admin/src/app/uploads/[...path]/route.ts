import { readUpload } from '@enjaz/core';
import { getSession } from '@/lib/auth';

// Preview of uploaded photos inside the admin panel (the public site serves the same rows itself).
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!(await getSession())) return new Response('Unauthorized', { status: 401 });
  const { path } = await ctx.params;
  if (path.length !== 1) return new Response('Not found', { status: 404 });
  const file = await readUpload(path[0]);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
