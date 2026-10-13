import { formatBandwidth, formatMinutes, statusTone } from '@/helpers/format';
import { isOffline, isReachable } from '@/helpers/overview';
import { OverviewStat } from '@/components/OverviewStat/OverviewStat';
import type { OverviewStatsProps } from './OverviewStats.types';
import { useLocale, translateStatus } from '@/lib/i18n';

export function OverviewStats({ dashboard, onNavigate }: OverviewStatsProps) {
  const { t } = useLocale();
  const health = dashboard.health;
  const services = dashboard.services || [];
  const streams = dashboard.streams || [];
  const pipeline = dashboard.pipeline || [];
  const plexReachable = isReachable(services.find((service) => service.name === 'Plex'));
  const offline = services.filter(isOffline);
  const activeDownloads = pipeline.filter((item) => /download/i.test(String(item.state || ''))).length;
  const importing = pipeline.filter((item) => /import/i.test(String(item.state || ''))).length;
  const capacityService = services.find((service) => /unraid/i.test(service.name));
  const bandwidth = streams.reduce((total, stream) => total + Number(stream.bandwidth || 0), 0);
  const watched = dashboard.analytics?.summary;
  const watchSource = isReachable(services.find((service) => /tautulli/i.test(service.name)));
  const tdarr = services.find((service) => /tdarr/i.test(service.name));
  const transcodeErrors = tdarr?.metrics?.transcodeErrors ?? 0;
  const healthTone = offline.length ? 'bad' : health?.label ? statusTone(health.label) : 'warn';

  return <section className="overview-summary" aria-label={t('overview.stackSummary')}>
    <OverviewStat icon="streams" label={t('overview.activeSessions')} onClick={() => onNavigate('streams')} value={plexReachable ? streams.length : '—'} note={plexReachable ? t('overview.transcodingCount', undefined, { value: streams.filter((stream) => stream.mode === 'Transcoding').length, bandwidth: formatBandwidth(bandwidth) }) : t('overview.plexUnavailable')} />
    <OverviewStat icon="pipeline" label={t('overview.acquisitionQueue')} onClick={() => onNavigate('pipeline')} value={pipeline.length} note={[activeDownloads ? t('overview.downloadingCount', undefined, { value: activeDownloads }) : '', importing ? t('overview.importingCount', undefined, { value: importing }) : ''].filter(Boolean).join(' · ') || t('overview.nothingProgress')} />
    <OverviewStat icon="refresh" label={t('overview.libraryOptimisation')} onClick={() => onNavigate('services')} value={tdarr?.metrics?.transcodeQueued != null ? <>{tdarr.metrics.transcodeQueued.toLocaleString()}<span> {t('overview.queued')}</span></> : '—'} noteClassName={transcodeErrors ? 'bad' : ''} note={tdarr ? transcodeErrors ? t('overview.errors', undefined, { value: transcodeErrors }) : t('overview.noErrorsTdarr') : t('overview.tdarrNotConfigured')} />
    <OverviewStat icon="servers" label={t('overview.freeStorage')} onClick={() => onNavigate('servers')} value={health?.freeStorage || '—'} note={capacityService ? `Unraid · ${translateStatus(t, capacityService.state)}` : t('overview.noStorageSource')} />
    <OverviewStat icon="media" label={t('overview.watched')} onClick={() => onNavigate('streams')} value={watchSource && watched?.plays != null ? <>{watched.plays.toLocaleString()}<span> {t('overview.plays')}</span></> : '—'} note={watchSource ? t('overview.watchTime', undefined, { value: formatMinutes(watched?.totalMinutes), days: watched?.periodDays ?? 30 }) : t('overview.tautulliUnavailable')} />
    <OverviewStat icon="services" label={t('overview.connectedServices')} onClick={() => onNavigate('services')} value={<>{health?.online ?? services.filter(isReachable).length}<span> / {health?.total ?? (services.length || '—')}</span></>} noteClassName={healthTone} note={offline.length ? t('overview.unavailableCount', undefined, { value: offline.length }) : health?.label ? translateStatus(t, health.label) : t('shell.healthUnavailable')} />
  </section>;
}
