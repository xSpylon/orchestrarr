import { Button } from '@/components/Button/Button';
import styles from '@/components/ItemDetails/ItemDetails.module.scss';
import type { ItemDetailsContainersProps } from './ItemDetailsContainers.types';
import { useLocale } from '@/lib/i18n';

const containerActions = ['start', 'stop', 'restart'] as const;

export function ItemDetailsContainers({ containers, onLogs, onAction }: ItemDetailsContainersProps) {
  const { t } = useLocale();
  return <div className="docker-container-list"><h3>{t('detail.containers')}</h3>{containers.map((container) => <div className={`docker-container-row ${styles.containerRow}`} key={container.name}>
    <div><strong>{container.name}</strong><small>{container.image} · {container.status}</small></div>
    <div className={styles.containerActions}><Button variant="ghost" onClick={() => onLogs(container.name)}>{t('detail.logs')}</Button>{containerActions.map((action) => <Button variant="ghost" key={action} onClick={() => onAction(action, container.name)}>{t(`detail.containerAction.${action}`, action)}</Button>)}</div>
  </div>)}</div>;
}
