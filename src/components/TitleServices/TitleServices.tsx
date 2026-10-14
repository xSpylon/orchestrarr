import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import type { TitleServicesProps } from './TitleServices.types';
import { useLocale } from '@/lib/i18n';

function serviceContext(value: string, t: ReturnType<typeof useLocale>['t']): string {
  const keys: Record<string, string> = {
    'Playing now': 'detail.playingNow', 'Checking Sonarr availability': 'detail.checkingSonarrAvailability', 'Checking playback history': 'detail.checkingPlaybackHistory', 'History lookup unavailable': 'detail.historyUnavailable', 'In playback history': 'detail.inPlaybackHistory', 'No matching playback': 'detail.noMatchingPlayback', 'Checking subtitle status': 'detail.checkingSubtitleStatus', 'Subtitle status unavailable': 'detail.subtitleUnavailable', 'No linked request': 'detail.noLinkedRequest', 'Requester unavailable': 'detail.requesterUnavailable', 'Checking library': 'detail.checkingLibrary', 'Library lookup unavailable': 'detail.libraryUnavailable', 'Not in Plex library': 'detail.notInPlex', 'Plex not configured': 'detail.plexNotConfigured', 'Radarr lookup unavailable': 'detail.radarrUnavailable', 'Checking Radarr library': 'detail.checkingRadarr', 'In queue': 'detail.inQueue', 'Sonarr availability unavailable': 'detail.sonarrUnavailable', 'Sonarr match could not be confirmed by TMDb ID': 'detail.sonarrMatchUnconfirmed', 'No matching series in Sonarr': 'detail.noMatchingSeries', 'Sonarr not configured': 'detail.sonarrNotConfigured', 'Could not confirm a Plex match by TMDb ID': 'detail.plexMatchUnconfirmed',
  };
  return keys[value] ? t(keys[value], value) : value;
}

export function TitleServices({ rows }: TitleServicesProps) {
  const { t } = useLocale();
  return <section className="universal-media-section universal-media-services">
    <SectionHeading title={t('common.services')} />
    <div className="linked-services universal-linked-services">{rows.map((service) => <div className="linked-service-row" key={service.name}><span className={`service-dot ${service.tone}`} /><strong>{service.name}</strong><small>{serviceContext(service.context, t)}</small>{service.url ? <a className="service-open" href={service.url} target="_blank" rel="noreferrer">{t('common.open')}</a> : null}</div>)}</div>
  </section>;
}
