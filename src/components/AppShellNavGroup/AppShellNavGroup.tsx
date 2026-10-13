import { Icon } from '@/components/ui/Icon';
import type { AppShellNavGroupProps } from './AppShellNavGroup.types';

export function AppShellNavGroup({ group, folded, count, hidden, onToggle, children }: AppShellNavGroupProps) {
  return <section className="nav-group">
    <button className="nav-group-toggle" aria-expanded={!folded} aria-controls={`nav-group-${group}`} onClick={onToggle}><span>{group}</span><span className="nav-group-meta">{folded && count ? <span className="nav-count alert">{count}</span> : null}<Icon name="chevron" className={!folded ? 'expanded' : ''} /></span></button>
    <div className="nav-group-items" id={`nav-group-${group}`} hidden={hidden}>{children}</div>
  </section>;
}
