import { exportContent, logAudit } from '@enjaz/core';
import { getClientIp, getSession } from '@/lib/auth';

// Downloads all site content as one JSON file. Password hashes and session tokens are never included.
export async function GET() {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (session.mustChangePassword) return new Response('Ganti password awal dulu.', { status: 403 });

  const data = await exportContent();
  await logAudit({ email: session.email, action: 'backup.download', ip: await getClientIp() });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="enjaz-cadangan-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
