import { useState } from 'react';
import { apiRequest, setAuthorizationHeader } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

/** Signs in with an API key (server session) or Basic credentials (header), then confirms the server accepts them. */
export function useLogin(mode: string, message: string | undefined, onAuthenticated: () => void) {
  const { t } = useLocale();
  const [key, setKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(message || '');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      if (mode === 'apikey') {
        await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ key }) });
      } else if (mode === 'basic') {
        // A server session (cookie) rather than a header: images load with it, and it survives a page reload.
        await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      } else {
        throw new Error(t('actions.authModeUnsupported'));
      }
      const status = await apiRequest<{ authenticated: boolean }>('/api/auth/status');
      if (!status.authenticated) throw new Error(t('actions.credentialsRejected'));
      onAuthenticated();
    } catch (cause) {
      setAuthorizationHeader('');
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally { setSubmitting(false); }
  }

  return { key, setKey, username, setUsername, password, setPassword, error, submitting, submit };
}
