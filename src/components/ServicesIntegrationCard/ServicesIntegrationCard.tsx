import { formatTime } from '@/helpers/format';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Button } from '@/components/Button/Button';
import { buttonClass } from '@/components/Button/button_class';
import type { ServicesIntegrationCardProps } from './ServicesIntegrationCard.types';
import { useLocale } from '@/lib/i18n';

export function ServicesIntegrationCard({ definition, service, url, onSelect, onEdit }: ServicesIntegrationCardProps) {
  const { t } = useLocale();
  const state = service?.state || 'Not configured';
  const detail = service?.detail || (state === 'Not configured' ? t('services.addDetails') : t('services.noDetails'));
  const description = t(`integration.${definition.key}.description`, definition.description);
  return <article className="integration-card">
    <span className="service-name" title={description}>{definition.name}</span>
    <StatusBadge value={state} />
    <span className="integration-card-detail" title={detail}>{detail}</span>
    <span className="integration-card-check" title={t('services.lastCheck')}>{formatTime(service?.checkedAt)}</span>
    <div className="integration-card-actions">{service ? <Button variant="ghost" size="small" onClick={() => onSelect(service)}>{t('common.details')}</Button> : null}<Button variant="ghost" size="small" className="integration-edit-button" onClick={() => onEdit(definition.key)}>{t('common.edit')}</Button>{url ? <a className={buttonClass({ variant: 'ghost', size: 'small' })} href={url} target="_blank" rel="noreferrer" aria-label={t('common.openNamed', undefined, { value: definition.name })}>{t('common.open')}</a> : null}</div>
  </article>;
}
