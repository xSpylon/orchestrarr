import { Button } from '@/components/Button/Button';
import { buttonClass } from '@/components/Button/button_class';
import type { ItemDetailsActionsProps } from './ItemDetailsActions.types';
import { useLocale } from '@/lib/i18n';

export function ItemDetailsActions({ item, onAction, onClose }: ItemDetailsActionsProps) {
  const { t } = useLocale();
  return <div className="drawer-actions">
    <Button onClick={onClose}>{t('common.close')}</Button>
    {item.retryAction === 'search' && item.actionId ? <Button variant="solid" onClick={() => onAction('retry', item)}>{t('dataTable.searchAgain')}</Button> : null}
    {item.importAction && item.queueId ? <Button variant="solid" onClick={() => onAction('import', item)}>{t('dataTable.importNow')}</Button> : null}
    {item.needsAction && item.openUrl ? <a className={buttonClass()} href={item.openUrl} target="_blank" rel="noreferrer">{t('common.openIn', undefined, { value: item.service || t('common.service') })}</a> : null}
    {item.blocklistAction && item.queueId ? <Button onClick={() => onAction('blocklist', item)}>{t('dataTable.blocklist')}</Button> : null}
    {item.resolved === false ? <Button onClick={() => onAction('resolve', item)}>{t('dataTable.dismissAlert')}</Button> : null}
  </div>;
}
