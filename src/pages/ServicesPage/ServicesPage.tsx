import type { DashboardData, Service } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { ServicesIntegrations } from '@/components/ServicesIntegrations/ServicesIntegrations';
import { ServicesHealthChecks } from '@/components/ServicesHealthChecks/ServicesHealthChecks';
import { useLocale } from '@/lib/i18n';

// App imports the definitions from here for the integration editor.
export { integrationDefinitions } from '@/components/ServicesIntegrations/integration_definitions';

type ServicesPageProps = { dashboard: DashboardData; onSelect: (item: Service) => void; onEdit: (key: string) => void };

export function ServicesPage({ dashboard, onSelect, onEdit }: ServicesPageProps) {
  const { t } = useLocale();
  const services = dashboard.services || [];
  return <>
    <PageHeading eyebrow={t('services.eyebrow')} title={t('nav.services')} />
    <ServicesIntegrations services={services} links={dashboard.links} onSelect={onSelect} onEdit={onEdit} />
    <ServicesHealthChecks services={services} onSelect={onSelect} />
    <PageFooter dashboard={dashboard} />
  </>;
}
