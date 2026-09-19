import { NextResponse } from 'next/server';
import { MAX_UPLOAD_BYTES, logAudit, saveImage } from '@enjaz/core';
import { getClientIp, getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  if (session.mustChangePassword) return NextResponse.json({ error: 'Ganti password awal dulu.' }, { status: 403 });

  // Refuse before reading the body when the declared size is already too large.
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return NextResponse.json({ error: 'Ukuran foto maksimal 5 MB.' }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get('file');
  } catch {
    return NextResponse.json({ error: 'Foto gagal dibaca.' }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'Tidak ada foto yang dikirim.' }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'Ukuran foto maksimal 5 MB.' }, { status: 413 });

  const result = await saveImage(Buffer.from(await file.arrayBuffer()));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 415 });
  await logAudit({ email: session.email, action: 'upload', target: result.url, ip: await getClientIp() });
  return NextResponse.json({ url: result.url });
}
