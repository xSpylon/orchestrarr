import { navigationPaths } from '@/lib/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { AppShellNavLinkProps } from './AppShellNavLink.types';

export function AppShellNavLink({ navKey, label, active, count, showTitle, onNavigate }: AppShellNavLinkProps) {
  return <a className={`nav-item ${active ? 'active' : ''}`} href={navigationPaths[navKey]} aria-current={active ? 'page' : undefined} title={showTitle ? label : undefined} onClick={(event) => {
    // Modified clicks keep their browser meaning (new tab, new window).
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onNavigate(navKey); }
  }}><Icon name={navKey as IconName} /><span className="nav-item-label">{label}</span>{Boolean(count) && <span className={`nav-count ${navKey === 'activity' || navKey === 'pipeline' ? 'alert' : ''}`}>{count}</span>}</a>;
}
