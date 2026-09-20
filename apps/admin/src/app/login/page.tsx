import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getI18n } from '@/i18n/server';
import { LangSwitch } from '@/components/LangSwitch';
import { LoginForm } from './LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).d.login.title };
}

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  const { d } = await getI18n();
  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src="/logo-full.png" alt={d.login.logoAlt} width={220} height={96} />
        <h1>{d.login.heading}</h1>
        <p className="muted">{d.login.lead}</p>
        <LoginForm />
        <div className="login-lang"><LangSwitch /></div>
      </div>
    </div>
  );
}
