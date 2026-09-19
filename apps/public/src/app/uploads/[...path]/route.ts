import { readUpload } from '@enjaz/core';

// Photos are stored in the database. File names are random UUIDs and never change content, so
// browsers and CDNs may cache them for a year.
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (path.length !== 1) return new Response('Not found', { status: 404 });

  const etag = `"${path[0]}"`;
  if (req.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  }
  const file = await readUpload(path[0]);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      // An uploaded file is never allowed to run as a page, whatever it claims to be.
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
