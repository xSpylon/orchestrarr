/* eslint-disable jsx-a11y/no-autofocus -- the sign-in page has one job, so the first field takes focus. */
import { Button } from '@/components/Button/Button';
import { useLogin } from '@/hooks/use_login';
import type { LoginFormProps } from './LoginForm.types';
import { useLocale } from '@/lib/i18n';

export function LoginForm({ mode, message, onAuthenticated }: LoginFormProps) {
  const { t } = useLocale();
  const login = useLogin(mode, message, onAuthenticated);
  const { error } = login;
  return <form className="login-form" onSubmit={login.submit}>
    {mode === 'apikey'
      ? <label><span>{t('auth.apiKey')}</span><input type="password" value={login.key} onChange={(event) => login.setKey(event.target.value)} autoComplete="current-password" aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} required autoFocus /></label>
      : <><label><span>{t('auth.username')}</span><input value={login.username} onChange={(event) => login.setUsername(event.target.value)} autoComplete="username" required autoFocus /></label><label><span>{t('auth.password')}</span><input type="password" value={login.password} onChange={(event) => login.setPassword(event.target.value)} autoComplete="current-password" required /></label></>}
    {error ? <p id="login-error" className="login-error" role="alert">{error}</p> : null}
    <Button variant="solid" type="submit" disabled={login.submitting}>{login.submitting ? t('auth.signingIn') : t('auth.signIn')}</Button>
  </form>;
}
