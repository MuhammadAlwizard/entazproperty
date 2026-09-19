import Link from 'next/link';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, getDict, isLocale, localePath } from '@/i18n';

export default async function NotFound() {
  // The proxy tells us which language the visitor was in (not-found pages get no route params).
  const raw = (await headers()).get('x-locale') ?? undefined;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const d = getDict(locale);
  return (
    <section className="sec page-head-sec">
      <div className="page-head">
        <h1>{d.notFound.title}</h1>
        <p>{d.notFound.text}</p>
        <p><Link href={localePath(locale, '/')} className="text-link">{d.notFound.back}</Link></p>
      </div>
    </section>
  );
}
