import { isReachable } from '@/helpers/overview';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { Button } from '@/components/Button/Button';
import { OverviewViewer } from '@/components/OverviewViewer/OverviewViewer';
import type { OverviewNowWatchingProps } from './OverviewNowWatching.types';
import { useLocale } from '@/lib/i18n';

export function OverviewNowWatching({ streams, plex, onNavigate }: OverviewNowWatchingProps) {
  const { t } = useLocale();
  const plexReachable = isReachable(plex);
  return <section className={`overview-section on-air-panel ${plexReachable ? 'source-available' : 'source-unavailable'}`}>
    <SectionHeading variant="operator" title={t('overview.nowWatching')} count={plexReachable ? streams.length : undefined} actions={<Button variant="link" onClick={() => onNavigate('streams')}>{t('overview.playbackHistory')}</Button>} />
    {plexReachable ? streams.length
      ? <ul className="on-air-list">{streams.slice(0, 3).map((stream, index) => <OverviewViewer key={`${stream.title}-${index}`} stream={stream} />)}</ul>
      : <div className="on-air-empty"><strong>{t('overview.nothingPlaying')}</strong><p>{t('overview.plexNoSessions')}</p></div>
      : <div className="on-air-empty"><strong>{t('overview.playbackUnavailable')}</strong><p>{plex?.detail || t('overview.restorePlex')}</p><button onClick={() => onNavigate('services')}>{t('overview.checkPlex')}</button></div>}
  </section>;
}
