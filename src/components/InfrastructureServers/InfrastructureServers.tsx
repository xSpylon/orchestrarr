import { ServiceCard } from '@/components/ServiceCard/ServiceCard';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import type { InfrastructureServersProps } from './InfrastructureServers.types';
import { useLocale } from '@/lib/i18n';

export function InfrastructureServers({ servers, onSelect }: InfrastructureServersProps) {
  const { t } = useLocale();
  return <div className="service-grid">{servers.length
    ? servers.map((service) => <ServiceCard key={service.name} service={service} onSelect={onSelect} checkLabel={t('services.lastSuccessfulCheck')} />)
    : <EmptyState compact title={t('infrastructure.noServers')}>{t('infrastructure.noServersDescription')}</EmptyState>}</div>;
}
