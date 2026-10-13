import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { integrationFieldsToSend } from '@/helpers/integration_fields';
import type { AppConfig } from '@/types/dashboard.types';
import type { IntegrationEditorProps } from '@/components/IntegrationEditor/IntegrationEditor.types';

export function useIntegrationEditor({ serviceKey, definition, onToast, onTest, onSaved }: IntegrationEditorProps) {
  const [url, setUrl] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingConfiguration, setLoadingConfiguration] = useState(true);

  useEffect(() => {
    setLoadingConfiguration(true);
    apiRequest<AppConfig>('/api/config').then((config) => {
      const saved = config.services?.[serviceKey];
      setUrl(saved?.url || '');
      // Plain settings show their saved value; secrets never do.
      if (saved?.publicUrl) setCredentials((current) => ({ ...current, publicUrl: saved.publicUrl || '' }));
    }).catch(() => {}).finally(() => setLoadingConfiguration(false));
  }, [serviceKey]);

  const integrationName = definition?.name || '';
  // TMDb and OMDb are cloud APIs: there is no URL to point at.
  const hasUrl = !['tmdb', 'omdb'].includes(serviceKey);
  const settings = () => ({ ...(hasUrl ? { url: url.trim() } : {}), ...integrationFieldsToSend(credentials) });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = { [serviceKey]: settings() };
    try {
      await apiRequest('/api/config', { method: 'PUT', body: JSON.stringify(payload) });
      onToast(`${integrationName} settings saved locally`);
      onSaved();
    } catch (cause) {
      onToast(`Could not save ${integrationName} settings · ${cause instanceof Error ? cause.message : 'Request failed'}`);
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try { await onTest(integrationName, settings()); }
    finally { setTesting(false); }
  }

  const setCredential = (key: string, value: string) => setCredentials((current) => ({ ...current, [key]: value }));
  return { url, setUrl, credentials, setCredential, hasUrl, saving, testing, loadingConfiguration, submit, testConnection };
}
