import { useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import type { SettingsNotificationsProps } from './SettingsNotifications.types';
import { useLocale } from '@/lib/i18n';

export function SettingsNotifications({ settings: { config, saving, saveConfig } }: SettingsNotificationsProps) {
  const { t } = useLocale();
  const [webhookUrl, setWebhookUrl] = useState('');

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await saveConfig({ notifications: { webhookUrl } }, 'Notifications')) setWebhookUrl('');
  }

  return <section className="settings-panel"><SectionHeading title={t('settings.notifications')} description={t('settings.notificationsDescription')} />
    <form className="integration-form" onSubmit={save}>
      <label><span>{t('settings.notificationWebhook')}</span><input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder={config.notificationsConfigured ? t('settings.configuredLeaveBlank') : 'https://…/webhook'} autoComplete="off" /><small>{t('settings.webhookHelp')}</small></label>
      <Button variant="solid" type="submit" disabled={saving || !webhookUrl}>{t('settings.saveNotifications')}</Button>
    </form>
  </section>;
}
