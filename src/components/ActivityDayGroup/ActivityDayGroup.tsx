import { formatClock } from '@/helpers/format';
import { ListRow } from '@/components/ListRow/ListRow';
import type { ActivityDayGroupProps } from './ActivityDayGroup.types';

export function ActivityDayGroup({ day, rows, onSelect }: ActivityDayGroupProps) {
  return <section aria-label={day}>
    <h3 className="list-group-head">{day}<small>{rows.length}</small></h3>
    {rows.map((item, index) => <ListRow key={`${item.title}-${index}`} title={item.title} detail={item.detail}
      tone={item.severity === 'failed' ? 'failed' : item.severity === 'attention' ? 'attention' : undefined}
      meta={<><span>{item.service || 'Orchestrarr'}</span><time>{formatClock(item.at || item.updatedAt)}</time></>}
      onClick={() => onSelect(item)} />)}
  </section>;
}
