import { BRAND_NAME, BrandMark, Wordmark } from '@/components/Brand/Brand';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { LoginForm } from '@/components/LoginForm/LoginForm';
import { useLocale } from '@/lib/i18n';

type LoginPageProps = { mode: string; message?: string; onAuthenticated: () => void };

export function LoginPage({ mode, message, onAuthenticated }: LoginPageProps) {
  const { t } = useLocale();
  return <main className="login-page"><section className="login-panel"><a className="brand" href="/" aria-label={`${BRAND_NAME} home`}><BrandMark /><Wordmark subtitle={t('auth.subtitle')} /></a><h1>{t('auth.signIn')}</h1><p>{t('auth.description')}</p>
    {/* An unsupported mode cannot be signed into, so explain the way out instead of showing a form. */}
    {mode === 'apikey' || mode === 'basic'
      ? <LoginForm mode={mode} message={message} onAuthenticated={onAuthenticated} />
      : <EmptyState>{t('auth.unsupported', undefined, { value: mode })} <span>{t('auth.configure')}</span></EmptyState>}
  </section></main>;
}
