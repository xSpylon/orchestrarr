import type { DashboardData, Service } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { InfrastructureServers } from '@/components/InfrastructureServers/InfrastructureServers';
import { InfrastructureStorage } from '@/components/InfrastructureStorage/InfrastructureStorage';
import { InfrastructureHost } from '@/components/InfrastructureHost/InfrastructureHost';
import { useLocale } from '@/lib/i18n';

type ServersPageProps = { dashboard: DashboardData; onSelect: (item: Service) => void };

export function ServersPage({ dashboard, onSelect }: ServersPageProps) {
  const { t } = useLocale();
  const servers = (dashboard.services || []).filter((service) => ['Plex', 'Unraid', 'Docker'].includes(service.name));
  return <>
    <PageHeading eyebrow={t('servers.eyebrow')} title={t('nav.servers')} />
    <InfrastructureServers servers={servers} onSelect={onSelect} />
    <InfrastructureStorage unraid={servers.find((service) => service.name === 'Unraid')} />
    <InfrastructureHost runtime={dashboard.runtime} />
    <PageFooter dashboard={dashboard} />
  </>;
}
