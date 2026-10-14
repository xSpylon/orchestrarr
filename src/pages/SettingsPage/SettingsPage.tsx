import type { DashboardData } from '@/types/dashboard.types';
import type { ThemePreference } from '@/hooks/use_theme_preference';
import { useSettingsConfig } from '@/hooks/use_settings_config';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { Button } from '@/components/Button/Button';
import { SettingsRow } from '@/components/SettingsRow/SettingsRow';
import { Toggle } from '@/components/Toggle/Toggle';
import { SettingsNotifications } from '@/components/SettingsNotifications/SettingsNotifications';
import { SettingsAccess } from '@/components/SettingsAccess/SettingsAccess';
import { localeOptions, useLocale } from '@/lib/i18n';

type SettingsPageProps = { dashboard: DashboardData; autoRefresh: boolean; technicalDetails: boolean; themePreference: ThemePreference; onThemeChange: (theme: ThemePreference) => void; onAutoRefresh: (enabled: boolean) => void; onTechnicalDetails: (enabled: boolean) => void; onToast: (message: string, persist?: boolean) => void; onNavigate: (view: string) => void; onRefresh: () => Promise<void> };

export function SettingsPage({ dashboard, autoRefresh, technicalDetails, themePreference, onThemeChange, onAutoRefresh, onTechnicalDetails, onToast, onNavigate, onRefresh }: SettingsPageProps) {
  const { locale, setLocale, t } = useLocale();
  const settings = useSettingsConfig(onToast);
  const demoMode = settings.config.demoMode ?? true;
  const publicDemo = Boolean(settings.config.publicDemo || dashboard.publicDemo);
  return <>
    <PageHeading eyebrow={t('settings.eyebrow')} title={t('settings.title')} />
    <div className="settings-list">
      <SettingsRow title={t('settings.language')} description={t('settings.languageDescription')}><select aria-label={t('settings.language')} value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>{localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></SettingsRow>
      <SettingsRow title={t('settings.theme')} description={t('settings.themeDescription')}><select aria-label={t('settings.theme')} value={themePreference} onChange={(event) => onThemeChange(event.target.value as ThemePreference)}><option value="system">{t('settings.system')}</option><option value="dark">{t('settings.dark')}</option><option value="light">{t('settings.light')}</option></select></SettingsRow>
      <SettingsRow title={t('settings.autoRefresh')} description={t('settings.autoRefreshDescription')}><Toggle checked={autoRefresh} onChange={onAutoRefresh} label={t('settings.autoRefresh')} /></SettingsRow>
      <SettingsRow title={t('settings.technicalDetails')} description={t('settings.technicalDetailsDescription')}><Toggle checked={technicalDetails} onChange={onTechnicalDetails} label={t('settings.technicalDetails')} /></SettingsRow>
      <SettingsRow title={t('settings.demoMode')} description={t('settings.demoModeDescription')}><Toggle checked={demoMode} disabled={!settings.loaded || settings.saving || publicDemo} label={t('settings.demoMode')} onChange={(enabled) => {
        // Switching reloads the whole dashboard, which takes a few seconds: say so until it is done.
        onToast(t(enabled ? 'settings.demoModeSwitchingOn' : 'settings.demoModeSwitchingOff'), true);
        void settings.saveConfig({ demoMode: enabled }, t('settings.demoMode'), onRefresh, t(enabled ? 'settings.demoModeOn' : 'settings.demoModeOff'));
      }} /></SettingsRow>
      {settings.loaded && demoMode && !publicDemo ? <SettingsRow title={t('settings.demoProfile')} description={t('settings.demoProfileDescription')}><select aria-label={t('settings.demoProfile')} value={settings.config.demoProfile || 'medium'} disabled={settings.saving} onChange={(event) => { void settings.saveConfig({ demoProfile: event.target.value }, t('settings.demoProfile'), onRefresh); }}><option value="small">{t('settings.demoProfileSmall')}</option><option value="medium">{t('settings.demoProfileMedium')}</option><option value="large">{t('settings.demoProfileLarge')}</option></select></SettingsRow> : null}
      <SettingsRow title={t('settings.integration')} description={t('settings.servicesReported', undefined, { value: dashboard.services?.length || 0 })}><Button onClick={() => onNavigate('services')}>{t('settings.openServices')}</Button></SettingsRow>
    </div>
    <SettingsNotifications settings={settings} />
    <SettingsAccess settings={settings} />
    <PageFooter dashboard={dashboard} />
  </>;
}
