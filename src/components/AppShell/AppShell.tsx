import { navigationGroups } from '@/lib/navigation';
import { navigationCounts } from '@/helpers/navigation_counts';
import { useAppShellSidebar } from '@/hooks/use_app_shell_sidebar';
import { AppShellNavigation } from '@/components/AppShellNavigation/AppShellNavigation';
import { AppShellTopBar } from '@/components/AppShellTopBar/AppShellTopBar';
import type { AppShellProps } from './AppShell.types';
import { useLocale } from '@/lib/i18n';

export function AppShell({ view, pageContext, dashboard, lastSync, children, onNavigate, onSearch, onRefresh, onAlerts, onDemoProfileChange, theme, onThemeToggle }: AppShellProps) {
  const { t } = useLocale();
  const activeGroup = navigationGroups.find(({ items }) => items.some(([key]) => key === view))?.group;
  const sidebar = useAppShellSidebar(view, activeGroup);
  const { collapsed, mobile, menuOpen, menuRef, closeMenu } = sidebar;
  const { counts, groupCounts, unresolvedAlerts } = navigationCounts(dashboard);
  const navigation = <AppShellNavigation view={view} dashboard={dashboard} sidebar={sidebar} counts={counts} groupCounts={groupCounts} onNavigate={onNavigate} onSearch={onSearch} />;

  const demoMode = dashboard?.mode === 'demo';
  return <div className={`app-shell ${collapsed && !mobile ? 'sidebar-collapsed' : ''}`}>
    {demoMode ? <div className="demo-banner" role="status"><div className="demo-banner-copy"><strong>{t('shell.demoMode')}</strong><span>{t('shell.demoDescription')}</span></div><div className="demo-banner-controls">{onDemoProfileChange ? <label><span className="sr-only">{t('settings.demoProfile')}</span><select aria-label={t('settings.demoProfile')} value={dashboard?.demoProfile || 'medium'} onChange={(event) => onDemoProfileChange(event.target.value)}><option value="small">{t('settings.demoProfileSmall')}</option><option value="medium">{t('settings.demoProfileMedium')}</option><option value="large">{t('settings.demoProfileLarge')}</option></select></label> : null}<button type="button" className="link-button" onClick={() => onNavigate('settings')}>{t('shell.openSettings')}</button></div></div> : null}
    <a className="skip-link" href="#main-content">{t('shell.skip')}</a>
    <div className="app-shell-body">
      {/* The backdrop click is a mouse shortcut; Esc covers the keyboard. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      {mobile ? <dialog className="mobile-navigation" ref={menuRef} aria-label={t('shell.navigation')} onCancel={closeMenu} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}><aside className="sidebar">{navigation}</aside></dialog> : <aside className="sidebar" aria-label={t('shell.primaryNavigation')}>{navigation}</aside>}
      <main className="main-content" id="main-content" tabIndex={-1}>
        <AppShellTopBar view={view} activeGroup={activeGroup} pageContext={pageContext} lastSync={lastSync} mobile={mobile} collapsed={collapsed} menuOpen={menuOpen} unresolvedAlerts={unresolvedAlerts} theme={theme} onSidebarToggle={mobile ? sidebar.openMenu : sidebar.toggleCollapsed} onSearch={onSearch} onRefresh={onRefresh} onThemeToggle={onThemeToggle} onAlerts={onAlerts} />
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  </div>;
}
