import { navigateRows } from '@/components/ui/list_keyboard';
import { displayText, mediaTypeLabel } from '@/helpers/format';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import styles from './RequestList.module.scss';
import type { RequestListProps } from './RequestList.types';
import { Button } from '@/components/Button/Button';
import { useLocale } from '@/lib/i18n';

export function RequestList({ items, onSelect, onRequestAction, emptyMessage }: RequestListProps) {
  const { t } = useLocale();
  if (!items.length) return <div className="empty-state">{emptyMessage || t('requests.defaultEmpty')}</div>;

  return (
    // Arrow keys from a focused row move to the next row; the rows themselves stay the tab stops.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={`request-list ${styles.list}`} onKeyDown={(event) => navigateRows(event, '.interactive-row')}>
      {items.map((item, index) => (
        <div className={`request-row ${styles.row} ${onRequestAction ? styles.managed : ''}`} key={`${item.requestId || item.title}-${index}`}>
          <span className={`request-type ${styles.type}`}>{mediaTypeLabel(item.detail)}</span>
          <button className={`interactive-row ${styles.select}`} onClick={() => onSelect(item)}>
            <span className={styles.copy}>
              <strong>{displayText(item.title)}</strong>
            <small>{item.requester || t('requests.unknownRequester')} · {item.age || t('requests.recently')}</small>
            </span>
          </button>
          <StatusBadge value={item.state} className={`request-state ${styles.state}`} />
          {onRequestAction && ['Pending', 'Requested'].includes(String(item.state)) ? <span className={styles.actions}>
            <Button size="small" onClick={() => onRequestAction(item, 'approve')}>{t('requests.approve')}</Button>
            <Button size="small" onClick={() => onRequestAction(item, 'decline')}>{t('requests.decline')}</Button>
          </span> : null}
        </div>
      ))}
    </div>
  );
}
