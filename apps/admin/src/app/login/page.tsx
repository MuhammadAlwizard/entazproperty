import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src="/logo-full.png" alt="PT Enjaz Instan Properti" width={220} height={96} />
        <h1>Masuk ke panel admin</h1>
        <p className="muted">Khusus pengelola website PT Enjaz Instan Properti.</p>
        <LoginForm />
      </div>
    </div>
  );
}
