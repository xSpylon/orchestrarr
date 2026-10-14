import { useCallback, useEffect, useState } from 'react';
import { setUnauthorizedHandler } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

export type AuthState = { checked: boolean; authenticated: boolean; mode: string; message?: string };

export function useAuthState() {
  const { t } = useLocale();
  const [auth, setAuth] = useState<AuthState>({ checked: false, authenticated: false, mode: 'none' });

  const checkAuth = useCallback((message?: string) => fetch('/api/auth/status', { cache: 'no-store', credentials: 'same-origin' })
    .then((response) => response.json())
    .then((status: { mode?: string; authenticated?: boolean }) => {
      setAuth({ checked: true, authenticated: Boolean(status.authenticated), mode: status.mode || 'none', ...(status.authenticated ? {} : { message }) });
    })
    .catch(() => setAuth({ checked: true, authenticated: true, mode: 'none' })), []);

  useEffect(() => {
    void checkAuth();
    // A 401 mid-session means the auth mode or credentials changed; re-check so the login page replaces a dead dashboard.
    setUnauthorizedHandler(() => { void checkAuth(t('auth.sessionExpired')); });
    return () => setUnauthorizedHandler(null);
  }, [checkAuth, t]);

  const markAuthenticated = useCallback(() => setAuth((current) => ({ ...current, authenticated: true, message: '' })), []);
  return { auth, markAuthenticated };
}
