import { useState } from 'react';
import { apiRequest, encodeBasicCredentials, setAuthorizationHeader } from '@/lib/api';
import type { SettingsConfig } from './use_settings_config';

function generateAccessKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useAccessSettings({ config, loaded, saveConfig }: SettingsConfig) {
  const [authMode, setAuthMode] = useState('none');
  const [authKey, setAuthKey] = useState('');
  const [keyGenerated, setKeyGenerated] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const auth = config.auth || {};
  const envManaged = (field: string) => auth.managedByEnv?.includes(field) ?? false;

  // Only the first load sets the form; later reloads (after a save) leave what was typed alone.
  const [initialized, setInitialized] = useState(false);
  if (loaded && !initialized) {
    setInitialized(true);
    setAuthMode(config.authMode || 'none');
    setAuthUsername(config.auth?.username || 'admin');
  }

  const generateKey = () => { setAuthKey(generateAccessKey()); setKeyGenerated(true); };
  const changeKey = (value: string) => { setAuthKey(value); setKeyGenerated(false); };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { auth: { mode: authMode, ...(authKey ? { apiKey: authKey } : {}), ...(authMode === 'basic' && authUsername ? { username: authUsername } : {}), ...(authPassword ? { password: authPassword } : {}) } };
    const saved = await saveConfig(payload, 'Access', async () => {
      // Sign this browser in with what was just entered, so enabling protection doesn't bounce you to the login page.
      if (authMode === 'apikey' && authKey) await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ key: authKey }) });
      if (authMode === 'basic' && authPassword) setAuthorizationHeader(encodeBasicCredentials(authUsername, authPassword));
    });
    if (saved) { setAuthKey(''); setKeyGenerated(false); setAuthPassword(''); }
    // Nothing was saved, so the selector goes back to the mode that is actually active.
    else setAuthMode(config?.authMode || 'none');
  }

  return { auth, envManaged, authMode, setAuthMode, authKey, changeKey, keyGenerated, generateKey, authUsername, setAuthUsername, authPassword, setAuthPassword, save };
}
