import { navigateRows } from '@/components/ui/list_keyboard';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { useState } from 'react';
import { displayText, pipelineStateLabel, type StatusShape } from '@/helpers/format';
import { pipelineShape } from '@/helpers/attention';
import { Icon } from '@/components/ui/Icon';
import { StatusIcon } from '@/components/StatusIcon/StatusIcon';
import styles from './DataTable.module.scss';
import type { DataTableGroupProps } from './DataTable.types';
import type { DashboardItem } from '@/types/dashboard.types';
import { Button } from '@/components/Button/Button';
import { buttonClass } from '@/components/Button/button_class';
import { useLocale } from '@/lib/i18n';

function displayTitle(item: DashboardItem): string {
  const titleIsHash = /^[a-f\d]{32,}$/i.test(item.title);
  if (item.service === 'qBittorrent' && item.torrentHash && (titleIsHash || item.title === 'Unknown download')) {
    return `Torrent · ${item.torrentHash.slice(0, 8)}`;
  }
  return displayText(item.title);
}

const groups: { key: string; state: string; shapes: StatusShape[] }[] = [
  { key: 'attention', state: 'Attention', shapes: ['attention', 'failed'] },
  { key: 'progress', state: 'Downloading', shapes: ['progress'] },
  { key: 'queued', state: 'Pending', shapes: ['pending'] },
  { key: 'done', state: 'Completed', shapes: ['done'] },
];

// qBittorrent reports a paused, unfinished download as stoppedDL (v5) or pausedDL (v4); only that one is resumed.
const stoppedDownload = (item: DashboardItem) => ['stoppedDL', 'pausedDL'].includes(item.state || '');

export function DataTable({ items, empty, onSelect, onAction, grouped = false }: DataTableGroupProps) {
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  if (!items.length) return <div className="empty-state">{empty}</div>;
  // A column where every row reads "Unavailable" is noise, so it only shows when a service reports it.
  const showUpdated = items.some((item) => item.updated);
  const renderRow = (item: DashboardItem, index: number) => <tr key={`${item.title}-${index}`}>
          <td><button className="queue-item-link" onClick={() => onSelect(item)} title={item.service === 'qBittorrent' && item.torrentHash ? t('dataTable.torrentHash', undefined, { value: item.torrentHash }) : undefined}><strong>{displayTitle(item)}</strong>{item.detail ? <small>{item.detail}</small> : null}</button></td>
          <td><span className="table-cell-label">{t('common.service')}</span>{String(item.service || item.server || t('status.unavailable'))}</td>
          {showUpdated ? <td><span className="table-cell-label">{t('common.updated')}</span>{String(item.updated || '—')}</td> : null}
          <td><StatusBadge value={pipelineStateLabel(item.state)} progress={item.progress} shape={pipelineShape(item)} /></td>
          <td><div className="row-actions" aria-label={t('common.itemActions', undefined, { value: displayTitle(item) })}>
            {/* A finished torrent that stopped seeding gets no Resume: resuming would only start seeding again. */}
            {item.service === 'qBittorrent' && item.torrentHash && !['stoppedUP', 'pausedUP'].includes(item.state || '') ? <Button variant="ghost" size="small" onClick={() => onAction?.(stoppedDownload(item) ? 'resume' : 'pause', item)}>{stoppedDownload(item) ? t('dataTable.resume') : t('dataTable.pause')}</Button> : null}
            {item.importAction && item.queueId ? <Button variant="ghost" size="small" onClick={() => onAction?.('import', item)}>{t('dataTable.importNow')}</Button> : null}
            {item.needsAction && item.openUrl ? <a className={buttonClass({ variant: 'ghost', size: 'small' })} href={item.openUrl} target="_blank" rel="noreferrer">{t('common.openIn', undefined, { value: item.service || '' })}</a> : null}
            {item.blocklistAction && item.queueId ? <Button variant="ghost" size="small" onClick={() => onAction?.('blocklist', item)}>{t('dataTable.blocklist')}</Button> : null}
          </div></td>
        </tr>;

  return (
    // Arrow keys from a focused row link move to the next row; the links themselves stay the tab stops.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={`data-table ${styles.table}`} onKeyDown={(event) => navigateRows(event, '.queue-item-link')}>
      <table className="queue-table">
        <caption className="sr-only">{t('dataTable.caption')}</caption>
        <thead className={grouped ? 'sr-only' : undefined}><tr><th scope="col">{t('dataTable.item')}</th><th scope="col">{t('common.service')}</th>{showUpdated ? <th scope="col">{t('common.updated')}</th> : null}<th scope="col">{t('dataTable.state')}</th><th scope="col"><span className="sr-only">{t('common.actions')}</span></th></tr></thead>
        {grouped ? groups.map((group) => {
          const rows = items.filter((item) => group.shapes.includes(pipelineShape(item)));
          if (!rows.length) return null;
          const label = t(`dataTable.group.${group.key}`);
          const closed = collapsed[group.key];
          return <tbody key={group.key}>
            <tr className="group-row"><th colSpan={showUpdated ? 5 : 4} scope="colgroup"><button type="button" aria-expanded={!closed} onClick={() => setCollapsed((current) => ({ ...current, [group.key]: !closed }))}><Icon name="chevron" className={closed ? '' : 'expanded'} /><StatusIcon state={group.state} /><span>{label}</span><small>{rows.length}</small></button></th></tr>
            {closed ? null : rows.map(renderRow)}
          </tbody>;
        }) : <tbody>{items.map(renderRow)}</tbody>}
      </table>
    </div>
  );
}
