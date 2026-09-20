import { NextResponse } from 'next/server';
import { MAX_UPLOAD_BYTES, logAudit, saveImage } from '@enjaz/core';
import { getClientIp, getSession } from '@/lib/auth';
import { getDict } from '@/i18n/server';

export async function POST(req: Request) {
  const d = await getDict(); // the error texts are shown to the admin by the uploader, so they follow the panel language
  const session = await getSession();
  if (!session) return NextResponse.json({ error: d.api.needLogin }, { status: 401 });
  if (session.mustChangePassword) return NextResponse.json({ error: d.api.changePasswordFirst }, { status: 403 });

  // Refuse before reading the body when the declared size is already too large.
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return NextResponse.json({ error: d.upload.tooLarge }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get('file');
  } catch {
    return NextResponse.json({ error: d.api.unreadable }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: d.api.noFile }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: d.upload.tooLarge }, { status: 413 });

  const result = await saveImage(Buffer.from(await file.arrayBuffer()), d.upload);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 415 });
  await logAudit({ email: session.email, action: 'upload', target: result.url, ip: await getClientIp() });
  return NextResponse.json({ url: result.url });
}
