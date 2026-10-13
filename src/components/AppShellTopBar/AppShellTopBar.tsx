import { navigationLabels } from '@/lib/navigation';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/Button/Button';
import type { AppShellTopBarProps } from './AppShellTopBar.types';
import { useLocale } from '@/lib/i18n';

export function AppShellTopBar({ view, activeGroup, pageContext, lastSync, mobile, collapsed, menuOpen, unresolvedAlerts, theme, onSidebarToggle, onSearch, onRefresh, onThemeToggle, onAlerts }: AppShellTopBarProps) {
  const { t } = useLocale();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return <header className="topbar">
    <Button variant="icon" className="sidebar-toggle" title={mobile ? t('shell.openNavigation') : collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')} aria-label={mobile ? t('shell.openNavigation') : collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')} aria-expanded={mobile ? menuOpen : !collapsed} onClick={onSidebarToggle}><Icon name="sidebar" /></Button>
    <nav className="top-context" aria-label={t('shell.pageLocation')}>{activeGroup ? <><span>{t(`group.${activeGroup.toLowerCase()}`, activeGroup)}</span><Icon name="chevron" /></> : null}<span aria-current="page">{pageContext || t(`nav.${view}`, navigationLabels[view] || 'Overview')}</span></nav>
    <div className="top-actions">{lastSync ? <span className="updated">{t('shell.updated', undefined, { value: lastSync })}</span> : null}<Button variant="icon" className="mobile-search" title={t('shell.searchShortcut')} aria-label={t('shell.searchWorkspace')} onClick={onSearch}><Icon name="search" /></Button><Button variant="icon" onClick={onRefresh} title={t('shell.refresh')} aria-label={t('shell.refresh')}><Icon name="refresh" /></Button><Button variant="icon" className="theme-button" onClick={onThemeToggle} title={t('shell.switchTheme', undefined, { value: nextTheme === 'light' ? t('settings.light') : t('settings.dark') })} aria-label={t('shell.switchTheme', undefined, { value: nextTheme === 'light' ? t('settings.light') : t('settings.dark') })}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></Button><Button variant="icon" className="notification-button" onClick={onAlerts} title={`${t('shell.attention', undefined, { value: unresolvedAlerts })}`} aria-label={t('shell.attention', undefined, { value: unresolvedAlerts })}><Icon name="bell" />{unresolvedAlerts > 0 && <span className="alert-dot" />}</Button></div>
  </header>;
}
