import { formatTime } from '@/helpers/format';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import type { ServiceCardProps } from './ServiceCard.types';
import { useLocale } from '@/lib/i18n';

export function ServiceCard({ service, onSelect, checkLabel = 'Last check' }: ServiceCardProps) {
  const { t } = useLocale();
  const detail = service.detail || (service.state === 'Not configured' ? t('services.addDetails') : t('services.noDetails'));
  return <button className="service-item" onClick={() => onSelect(service)}>
    <div className="service-top"><span className="service-name">{service.name}</span><StatusBadge value={service.state} /></div>
    <p>{detail}</p>
    <div className="service-meta"><span>{checkLabel === 'Last check' ? t('services.lastCheck') : checkLabel}</span><span>{formatTime(service.checkedAt)}</span></div>
  </button>;
}
