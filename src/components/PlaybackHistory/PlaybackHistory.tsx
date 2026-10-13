import { formatTime } from '@/helpers/format';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ListRow } from '@/components/ListRow/ListRow';
import type { PlaybackHistoryProps } from './PlaybackHistory.types';
import { useLocale } from '@/lib/i18n';

export function PlaybackHistory({ history }: PlaybackHistoryProps) {
  const { t } = useLocale();
  return <section className="section-block">
    <SectionHeading title={t('overview.playbackHistory')} description={t('playback.historyDescription')} />
    <div className="activity-list">{history.length
      ? history.slice(0, 12).map((item, index) => <ListRow key={`${item.title}-${index}`} title={item.title} detail={<>{item.user} · {item.platform}</>} meta={<time>{formatTime(item.watchedAt)}</time>} />)
      : <EmptyState compact title={t('playback.noHistory')}>{t('playback.noHistoryDescription')}</EmptyState>}</div>
  </section>;
}
