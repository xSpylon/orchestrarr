import { useCallback, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell/AppShell';
import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { AppRoutes } from '@/components/AppRoutes/AppRoutes';
import { AppWorkspaceStatus } from '@/components/AppWorkspaceStatus/AppWorkspaceStatus';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { Toast } from '@/components/Toast/Toast';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { parseAppRoute } from '@/helpers/app_route';
import { useAppDrawer } from '@/hooks/use_app_drawer';
import { useAppLocation } from '@/hooks/use_app_location';
import { useAuthState } from '@/hooks/use_auth_state';
import { useDashboard } from '@/hooks/use_dashboard';
import { useItemActions } from '@/hooks/use_item_actions';
import { useKeyboardShortcuts } from '@/hooks/use_keyboard_shortcuts';
import { useLastSync } from '@/hooks/use_last_sync';
import { useStoredFlag } from '@/hooks/use_stored_flag';
import { useThemePreference } from '@/hooks/use_theme_preference';
import { useTitleNavigation } from '@/hooks/use_title_navigation';
import { useTitleRoute } from '@/hooks/use_title_route';
import { useToast } from '@/hooks/use_toast';
import { useLocale } from '@/lib/i18n';
import { apiRequest } from '@/lib/api';
import type { ActivityItem, DashboardItem, Service } from '@/types/dashboard.types';

export function App() {
  const { t } = useLocale();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { drawerItem, editingService, closeDrawer, showItem, editService } = useAppDrawer();
  const { toastMessage, showToast } = useToast(closeDrawer);
  const { auth, markAuthenticated } = useAuthState();
  const [autoRefresh, setAutoRefresh] = useStoredFlag('autoRefresh', true);
  const [technicalDetails, setTechnicalDetails] = useStoredFlag('technicalDetails', false);
  const { themePreference, theme, changeTheme, toggleTheme } = useThemePreference(showToast);
  const { dashboard, loading, error, refresh } = useDashboard(autoRefresh, showToast, auth.checked && auth.authenticated);
  const [syncing, setSyncing] = useState(false);
  const syncLabel = useLastSync(dashboard, error);
  const lastSync = syncing ? t('shell.syncing') : syncLabel;

  const changeDemoProfile = async (profile: string) => {
    try {
      await apiRequest('/api/config', { method: 'PUT', body: JSON.stringify({ demoProfile: profile }) });
      await refresh(true);
      showToast(t('settings.saved', undefined, { label: t('settings.demoProfile') }));
    } catch (cause) {
      showToast(t('settings.saveFailed', undefined, { label: t('settings.demoProfile').toLowerCase(), reason: cause instanceof Error ? cause.message : t('common.requestFailed') }));
    }
  };

  const closeOverlays = useCallback(() => { setPaletteOpen(false); closeDrawer(); }, [closeDrawer]);
  const { location, navigate } = useAppLocation({ onPopState: closeDrawer, onNavigate: closeOverlays });
  const route = useMemo(() => parseAppRoute(location.pathname), [location.pathname]);
  const openTitle = useTitleNavigation(navigate, showToast);
  const { titleItem, mediaFocus, setEpisodeFocus } = useTitleRoute(route, navigate);
  const { performAction, testService } = useItemActions(refresh, showToast);
  useKeyboardShortcuts(navigate, setPaletteOpen);

  // Requests and library items open their title page; anything else opens in the drawer.
  const openItem = (item: DashboardItem | ActivityItem | Service) => {
    const candidate = item as DashboardItem;
    if (candidate.requester || candidate.library === 'Jellyseerr') { void openTitle(candidate, 'request'); return; }
    if (candidate.ratingKey || candidate.library) { void openTitle(candidate, 'media'); return; }
    showItem(candidate);
  };
  const runAction = (action: string, item: DashboardItem) => void performAction(action, item);

  if (auth.checked && !auth.authenticated) return <LoginPage mode={auth.mode} message={auth.message} onAuthenticated={markAuthenticated} />;

  return <>
    <AppShell view={route.view} pageContext={route.isCanonicalTitle ? t('shell.titleDetails') : undefined} dashboard={dashboard} lastSync={lastSync} theme={theme} onThemeToggle={toggleTheme} onNavigate={navigate} onSearch={() => setPaletteOpen(true)} onRefresh={() => { setSyncing(true); void refresh(true).finally(() => setSyncing(false)); }} onAlerts={() => navigate('activity?filter=alerts')} onDemoProfileChange={changeDemoProfile}>
      {dashboard
        ? <AppRoutes route={route} locationKey={`${location.pathname}${location.search}`} dashboard={dashboard} title={{ item: titleItem, focus: mediaFocus, onEpisodeSelect: setEpisodeFocus }} preferences={{ autoRefresh, technicalDetails, themePreference, onThemeChange: changeTheme, onAutoRefresh: setAutoRefresh, onTechnicalDetails: setTechnicalDetails }} onNavigate={navigate} onSelect={openItem} onOpenTitle={openTitle} onAction={runAction} onEditService={editService} onToast={showToast} onRefresh={refresh} />
        : <AppWorkspaceStatus loading={loading} error={error} onRetry={() => void refresh()} />}
    </AppShell>
    <Toast message={drawerItem || editingService ? '' : toastMessage} />
    <CommandPalette open={paletteOpen} dashboard={dashboard} onClose={() => setPaletteOpen(false)} onNavigate={navigate} onSelect={openItem} theme={theme} onThemeToggle={toggleTheme} onRefresh={() => { void refresh(true); }} />
    <AppDrawer item={drawerItem} editingService={editingService} toastMessage={toastMessage} technicalDetails={technicalDetails} onClose={closeDrawer} onSaved={() => { closeDrawer(); void refresh(); }} onToast={showToast} onTest={testService} onAction={runAction} />
  </>;
}
