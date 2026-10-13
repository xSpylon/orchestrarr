import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { PlaybackStream } from '@/components/PlaybackStream/PlaybackStream';
import type { PlaybackNowPlayingProps } from './PlaybackNowPlaying.types';
import { useLocale } from '@/lib/i18n';

export function PlaybackNowPlaying({ streams, unavailable, unavailableDetail }: PlaybackNowPlayingProps) {
  const { t } = useLocale();
  return <section className="section-block">
    <SectionHeading title={t('playback.nowPlaying')} />
    {unavailable
      ? <EmptyState compact role="status">{unavailableDetail || t('playback.unavailable')}</EmptyState>
      : <div className="activity-list">{streams.length ? streams.map((stream, index) => <PlaybackStream key={`${stream.title}-${index}`} stream={stream} />) : <EmptyState compact title={t('playback.nothingPlaying')}>{t('playback.noSessions')}</EmptyState>}</div>}
  </section>;
}
