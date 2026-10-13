import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { itemDetailFields } from '@/helpers/item_detail_fields';
import { PropertyList, Property } from '@/components/PropertyList/PropertyList';
import { ItemDetailsActions } from '@/components/ItemDetailsActions/ItemDetailsActions';
import { ItemDetailsContainers } from '@/components/ItemDetailsContainers/ItemDetailsContainers';
import type { ItemDetailsDockerContainer } from '@/components/ItemDetailsContainers/ItemDetailsContainers.types';
import type { ItemDetailsProps } from './ItemDetails.types';
import styles from './ItemDetails.module.scss';
import { useLocale, translateStatus } from '@/lib/i18n';

export function ItemDetails({ item, technicalDetails, onAction, onToast, onClose }: ItemDetailsProps) {
  const { t } = useLocale();
  const [dockerLogs, setDockerLogs] = useState('');
  const containers = Array.isArray(item.containers) ? item.containers as ItemDetailsDockerContainer[] : [];

  async function loadLogs(name: string) {
    try {
      const result = await apiRequest<{ logs?: string }>(`/api/docker/logs?container=${encodeURIComponent(name)}`);
      setDockerLogs(result.logs || t('detail.noRecentLogs'));
    } catch (cause) {
      onToast(t('detail.logsFailed', undefined, { reason: cause instanceof Error ? cause.message : t('common.requestFailed') }));
    }
  }

  return <div className={styles.details}>
    {item.resolved !== undefined ? <p className="drawer-intro">{item.resolved ? t('detail.alertDismissed') : t('detail.alertOpen')}</p> : null}
    <PropertyList>{itemDetailFields(item).map(([label, value]) => <Property key={label} label={t(`detail.field.${label}`, label)}>{typeof value === 'string' || typeof value === 'number' ? (label === 'State' || label === 'Status' ? translateStatus(t, value) : value) : '—'}</Property>)}</PropertyList>
    {technicalDetails && item.error ? <pre className="docker-logs">{String(item.error)}</pre> : null}
    {item.name === 'Docker' && containers.length ? <ItemDetailsContainers containers={containers} onLogs={(name) => void loadLogs(name)} onAction={(action, name) => onAction(`docker-${action}:${name}`, item)} /> : null}
    {dockerLogs ? <pre className="docker-logs">{dockerLogs}</pre> : null}
    <ItemDetailsActions item={item} onAction={onAction} onClose={onClose} />
  </div>;
}
