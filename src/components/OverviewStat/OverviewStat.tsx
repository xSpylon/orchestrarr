import { Icon } from '@/components/ui/Icon';
import type { OverviewStatProps } from './OverviewStat.types';

export function OverviewStat({ icon, label, value, note, noteClassName, onClick }: OverviewStatProps) {
  return <button className="overview-stat" onClick={onClick}><span className="overview-stat-label"><Icon name={icon} />{label}</span><strong>{value}</strong><small className={noteClassName}>{note}</small></button>;
}
