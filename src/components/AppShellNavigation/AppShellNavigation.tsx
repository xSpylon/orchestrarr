import { statusTone } from '@/helpers/format';
import { navigationGroups } from '@/lib/navigation';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/Button/Button';
import { BRAND_NAME, BrandMark, Wordmark } from '@/components/Brand/Brand';
import { AppShellNavGroup } from '@/components/AppShellNavGroup/AppShellNavGroup';
import { AppShellNavLink } from '@/components/AppShellNavLink/AppShellNavLink';
import type { AppShellNavigationProps } from './AppShellNavigation.types';
import { useLocale } from '@/lib/i18n';

export function AppShellNavigation({ view, dashboard, sidebar, counts, groupCounts, onNavigate, onSearch }: AppShellNavigationProps) {
  const { t } = useLocale();
  const { collapsed, mobile, collapsedGroups, closeMenu, toggleGroup } = sidebar;
  const workspace = dashboard?.runtime?.host || (dashboard?.mode === 'demo' ? t('shell.demoWorkspace') : t('shell.localWorkspace'));
  const stackTone = dashboard ? statusTone(dashboard.health?.label) : 'warn';
  const stackMessage = !dashboard ? t('shell.connecting') : stackTone === 'good' ? t('shell.stackConnected') : stackTone === 'warn' ? t('shell.needsAttention') : t('shell.healthUnavailable');
  const go = (destination: string) => { closeMenu(); onNavigate(destination); };
  const navLink = (key: string, label: string) => <AppShellNavLink key={key} navKey={key} label={t(`nav.${key}`, label)} active={view === key} count={counts[key]} showTitle={collapsed && !mobile} onNavigate={go} />;

  return <>
    <div className="workspace-heading"><a className="brand" href="/" onClick={(event) => { event.preventDefault(); go('overview'); }} aria-label={`${BRAND_NAME} home`}><BrandMark /><Wordmark subtitle={workspace} /></a><Button variant="icon" onClick={() => { closeMenu(); onSearch(); }} aria-label={t('shell.searchCommands')} title={`${t('shell.searchCommands')}  ⌘K`}><Icon name="search" /></Button>{mobile && <Button variant="icon" aria-label={t('shell.closeNavigation')} title={t('shell.closeNavigation')} onClick={closeMenu}><Icon name="close" /></Button>}</div>
    <nav className="nav" aria-label={`${BRAND_NAME} sections`}>
      {navLink('overview', 'Overview')}
      {navigationGroups.map(({ group, items }) => <AppShellNavGroup key={group} group={t(`group.${group.toLowerCase()}`, group)} folded={Boolean(collapsedGroups[group])} count={groupCounts[group]} hidden={collapsedGroups[group] && (!collapsed || mobile)} onToggle={() => toggleGroup(group)}>{items.map(([key, label]) => navLink(key, label))}</AppShellNavGroup>)}
    </nav>
    <div className="sidebar-bottom"><div className="local-status" title={stackMessage}><span className={`status-light ${stackTone}`} /><span>{stackMessage}</span>{dashboard?.mode === 'demo' && <span className="workspace-mode">{t('shell.demoMode')}</span>}</div></div>
  </>;
}
