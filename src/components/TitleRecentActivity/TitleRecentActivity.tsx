import { formatTime } from '@/helpers/format';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import type { TitleRecentActivityProps } from './TitleRecentActivity.types';
import { useLocale } from '@/lib/i18n';

/** Dashboard activity, Tautulli plays and live Plex streams for this title, newest first. */
export function TitleRecentActivity({ title, activity, playback, activeStreams }: TitleRecentActivityProps) {
  const { t } = useLocale();
  if (!activity.length && !playback.length && !activeStreams.length) return null;
  const events = [
    ...activity.map((entry) => ({ title: entry.title, detail: entry.detail, at: entry.at, service: entry.service })),
    ...playback.map((entry) => ({ title: entry.title || title, detail: t('detail.playedBy', undefined, { user: entry.user || t('overview.userUnavailable'), platform: entry.platform || t('detail.platformUnavailable') }), at: entry.watchedAt, service: 'Tautulli' })),
    ...activeStreams.map((entry) => ({ title: entry.title, detail: t('detail.playingDetail', undefined, { user: entry.user || t('overview.userUnavailable'), mode: entry.mode || t('overview.modeUnknown'), quality: entry.quality || t('playback.qualityUnavailable') }), at: '', service: 'Plex' })),
  ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).slice(0, 8);
  return <section className="universal-media-section universal-media-activity">
    <SectionHeading title={t('overview.recentActivity')} />
    <div className="event-log">
      {events.map((entry, index) => (
        <div className="event-row active" key={`${entry.service}-${entry.title}-${index}`}>
          <i />
          <div><strong>{entry.title}</strong><small>{entry.detail} · {entry.at ? formatTime(entry.at) : t('detail.now')}</small></div>
        </div>
      ))}
    </div>
  </section>;
}
