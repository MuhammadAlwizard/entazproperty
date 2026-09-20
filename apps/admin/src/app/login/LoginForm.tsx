'use client';

import { useActionState } from 'react';
import { useI18n } from '@/i18n/client';
import { login, type LoginState } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(login, undefined);
  const { d } = useI18n();
  return (
    <form action={action} className="stack">
      <label className="field">
        <span>{d.login.email}</span>
        <input name="email" type="email" dir="ltr" autoComplete="username" required autoFocus />
      </label>
      <label className="field">
        <span>{d.login.password}</span>
        <input name="password" type="password" dir="ltr" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="notice notice-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? d.login.checking : d.login.submit}</button>
    </form>
  );
}
