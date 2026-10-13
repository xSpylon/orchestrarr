import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { AppConfig } from '@/types/dashboard.types';
import { useLocale } from '@/lib/i18n';

export type SettingsConfig = ReturnType<typeof useSettingsConfig>;

/** The server config behind Settings, plus one save that every settings form shares (so one save disables them all). */
export function useSettingsConfig(onToast: (message: string) => void) {
  const { t } = useLocale();
  const [config, setConfig] = useState<AppConfig>({});
  // Set once the first load has arrived, so forms can take their starting values from it.
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { apiRequest<AppConfig>('/api/config').then((value) => { setConfig(value); setLoaded(true); }).catch(() => { }); }, []);

  const saveConfig = useCallback(async (payload: Record<string, unknown>, label: string, afterSave?: () => Promise<void> | void) => {
    setSaving(true);
    try {
      await apiRequest('/api/config', { method: 'PUT', body: JSON.stringify(payload) });
      await afterSave?.();
      const nextConfig = await apiRequest<AppConfig>('/api/config'); setConfig(nextConfig);
      onToast(t('settings.saved', undefined, { label }));
      return true;
    } catch (cause) {
      onToast(t('settings.saveFailed', undefined, { label: label.toLowerCase(), reason: cause instanceof Error ? cause.message : t('common.requestFailed') }));
      return false;
    } finally { setSaving(false); }
  }, [onToast, t]);

  return { config, loaded, saving, saveConfig };
}
