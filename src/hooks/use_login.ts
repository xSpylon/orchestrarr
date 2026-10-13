import { useState } from 'react';
import { apiRequest, encodeBasicCredentials, setAuthorizationHeader } from '@/lib/api';

/** Signs in with an API key (server session) or Basic credentials (header), then confirms the server accepts them. */
export function useLogin(mode: string, message: string | undefined, onAuthenticated: () => void) {
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
        setAuthorizationHeader(encodeBasicCredentials(username, password));
      } else {
        throw new Error('This authentication mode is not supported.');
      }
      const status = await apiRequest<{ authenticated: boolean }>('/api/auth/status');
      if (!status.authenticated) throw new Error('The credentials were not accepted.');
      onAuthenticated();
    } catch (cause) {
      setAuthorizationHeader('');
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally { setSubmitting(false); }
  }

  return { key, setKey, username, setUsername, password, setPassword, error, submitting, submit };
}
