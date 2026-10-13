import { Button } from '@/components/Button/Button';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { useAccessSettings } from '@/hooks/use_access_settings';
import type { SettingsAccessProps } from './SettingsAccess.types';
import { useLocale } from '@/lib/i18n';

/** Who can open the app: the auth mode and its key or password. Fields set by environment variables are locked. */
export function SettingsAccess({ settings }: SettingsAccessProps) {
  const { t } = useLocale();
  const access = useAccessSettings(settings);
  const { auth, envManaged, authMode, keyGenerated } = access;
  return <section className="settings-panel"><SectionHeading title={t('settings.access')} description={t('settings.accessDescription')} />
    <form className="integration-form" onSubmit={access.save}>
      <label><span>{t('settings.authenticationMode')}</span><select value={authMode} disabled={envManaged('mode')} onChange={(event) => access.setAuthMode(event.target.value)}><option value="none">{t('settings.trustedNetwork')}</option><option value="apikey">{t('settings.apiKeyRequired')}</option><option value="basic">{t('settings.basicAuth')}</option></select><small>{envManaged('mode') ? t('settings.managedByAuthMode') : t('settings.protectsApiRoutes')}</small></label>
      {authMode === 'apikey' ? <label><span>{t('auth.apiKey')}</span><span className="auth-key-row"><input type={keyGenerated ? 'text' : 'password'} value={access.authKey} disabled={envManaged('apiKey')} onChange={(event) => access.changeKey(event.target.value)} placeholder={auth.apiKeySet ? t('settings.setLeaveBlank') : t('settings.required')} autoComplete="new-password" /><Button type="button" disabled={envManaged('apiKey')} onClick={access.generateKey}>{t('settings.generate')}</Button></span><small>{envManaged('apiKey') ? t('settings.managedByApiKey') : keyGenerated ? t('settings.copyKey') : t('settings.apiKeyHelp')}</small></label> : null}
      {authMode === 'basic' ? <>
        <label><span>{t('auth.username')}</span><input value={access.authUsername} disabled={envManaged('username')} onChange={(event) => access.setAuthUsername(event.target.value)} autoComplete="username" /><small>{envManaged('username') ? t('settings.managedByUsername') : t('settings.usernameHelp')}</small></label>
        <label><span>{t('auth.password')}</span><input type="password" value={access.authPassword} disabled={envManaged('password')} onChange={(event) => access.setAuthPassword(event.target.value)} placeholder={auth.passwordSet ? t('settings.setLeaveBlank') : t('settings.required')} autoComplete="new-password" /><small>{envManaged('password') ? t('settings.managedByPassword') : t('settings.passwordHelp')}</small></label>
      </> : null}
      <Button variant="solid" type="submit" disabled={settings.saving}>{settings.saving ? t('common.saving') : t('settings.saveAccess')}</Button>
    </form>
  </section>;
}
