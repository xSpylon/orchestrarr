import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { ServicesIntegrationCard } from '@/components/ServicesIntegrationCard/ServicesIntegrationCard';
import { integrationDefinitions } from './integration_definitions';
import type { ServicesIntegrationsProps } from './ServicesIntegrations.types';
import { useLocale } from '@/lib/i18n';

const linkKeys: Record<string, string> = { Plex: 'plex', Tautulli: 'tautulli', Jellyseerr: 'jellyseerr', Wizarr: 'wizarr', Cleanuparr: 'cleanuparr', Tdarr: 'tdarr', Prowlarr: 'prowlarr', Bazarr: 'bazarr', Sonarr: 'sonarr', Radarr: 'radarr', 'qBittorrent': 'qbittorrent', SABnzbd: 'sabnzbd', Unraid: 'unraid' };

export function ServicesIntegrations({ services, links, onSelect, onEdit }: ServicesIntegrationsProps) {
  const { t } = useLocale();
  return <section className="settings-panel services-panel">
    <SectionHeading title={t('services.connected')} count={integrationDefinitions.length} description={t('services.credentials')} />
    <div className="integration-cards">{integrationDefinitions.map((definition) => <ServicesIntegrationCard key={definition.key} definition={definition} service={services.find((item) => item.name === definition.name)} url={links?.[linkKeys[definition.name.split(' · ')[0]]]} onSelect={onSelect} onEdit={onEdit} />)}</div>
  </section>;
}
