import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { ServiceCard } from '@/components/ServiceCard/ServiceCard';
import type { ServicesHealthChecksProps } from './ServicesHealthChecks.types';
import { useLocale } from '@/lib/i18n';

/** Checks without their own integration card; renders nothing when neither is reported. */
export function ServicesHealthChecks({ services, onSelect }: ServicesHealthChecksProps) {
  const { t } = useLocale();
  const checks = services.filter((service) => service.name === 'Plex library' || service.name === 'Docker');
  if (!checks.length) return null;
  return <section className="settings-panel services-panel">
    <SectionHeading title={t('services.additionalChecks')} description={t('services.additionalChecksDescription')} />
    <div className="service-grid">{checks.map((service) => <ServiceCard key={service.name} service={service} onSelect={onSelect} />)}</div>
  </section>;
}
