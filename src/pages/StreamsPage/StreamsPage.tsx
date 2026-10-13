import type { DashboardData } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { PlaybackSummary } from '@/components/PlaybackSummary/PlaybackSummary';
import { PlaybackNowPlaying } from '@/components/PlaybackNowPlaying/PlaybackNowPlaying';
import { PlaybackHistory } from '@/components/PlaybackHistory/PlaybackHistory';
import { useLocale } from '@/lib/i18n';

type StreamsPageProps = { dashboard: DashboardData };

export function StreamsPage({ dashboard }: StreamsPageProps) {
  const { t } = useLocale();
  const streams = dashboard.streams || [];
  const plex = dashboard.services?.find((service) => service.name === 'Plex');
  const playbackUnavailable = !plex || /offline|unreachable|failed|error/i.test(plex.state);
  return <>
    <PageHeading eyebrow={t('streams.eyebrow')} title={t('nav.streams')} />
    <PlaybackSummary streams={streams} unavailable={playbackUnavailable} summary={dashboard.analytics?.summary || {}} />
    <PlaybackNowPlaying streams={streams} unavailable={playbackUnavailable} unavailableDetail={plex?.detail} />
    <PlaybackHistory history={dashboard.analytics?.history || []} />
    <PageFooter dashboard={dashboard} />
  </>;
}
