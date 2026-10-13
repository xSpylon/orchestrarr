import { useCallback, useEffect, useState } from 'react';
import { setUnauthorizedHandler } from '@/lib/api';

export type AuthState = { checked: boolean; authenticated: boolean; mode: string; message?: string };

export function useAuthState() {
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
    setUnauthorizedHandler(() => { void checkAuth('Your session is no longer authorised. Sign in again.'); });
    return () => setUnauthorizedHandler(null);
  }, [checkAuth]);

  const markAuthenticated = useCallback(() => setAuth((current) => ({ ...current, authenticated: true, message: '' })), []);
  return { auth, markAuthenticated };
}
