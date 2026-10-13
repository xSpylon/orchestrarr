import { formatMinutes } from '@/helpers/format';
import { SummaryStrip } from '@/components/SummaryStrip/SummaryStrip';
import type { PlaybackSummaryProps } from './PlaybackSummary.types';
import { useLocale } from '@/lib/i18n';

export function PlaybackSummary({ streams, unavailable, summary }: PlaybackSummaryProps) {
  const { t } = useLocale();
  return <SummaryStrip items={[
    { label: t('overview.activeSessions'), value: unavailable ? t('status.unavailable') : streams.length },
    { label: t('overview.transcoding'), value: unavailable ? t('status.unavailable') : streams.filter((item) => item.mode === 'Transcoding').length },
    { label: t('playback.playsLastDays', undefined, { value: summary.periodDays ?? 30 }), value: summary.plays ?? t('status.unavailable') },
    { label: t('playback.watchTimeLastDays', undefined, { value: summary.periodDays ?? 30 }), value: formatMinutes(summary.totalMinutes) },
  ]} />;
}
