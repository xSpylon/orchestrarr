import { displayText, formatBandwidth } from '@/helpers/format';
import { ListRow } from '@/components/ListRow/ListRow';
import { Property } from '@/components/PropertyList/PropertyList';
import type { PlaybackStreamProps } from './PlaybackStream.types';
import { useLocale } from '@/lib/i18n';

/** A live session with its technical details folded away. */
export function PlaybackStream({ stream }: PlaybackStreamProps) {
  const { t } = useLocale();
  return <article className="now-playing">
    <ListRow tone="live" title={displayText(stream.title)} detail={[stream.user || t('overview.userUnavailable'), stream.device || t('playback.deviceUnavailable'), stream.quality || t('playback.qualityUnavailable')].join(' · ')} meta={<><span>{stream.mode || t('playback.modeUnavailable')}</span>{stream.progress != null ? <span>{stream.progress}%</span> : null}</>} />
    {/* Plain dl, not PropertyList: stream-facts is an inline layout that detail-list would override. */}
    <details className="now-playing-details"><summary>{t('settings.technicalDetails')}</summary><dl className="stream-facts">
      <Property label={t('playback.client')}>{stream.client || t('status.unavailable')}</Property>
      <Property label={t('playback.codecs')}>{stream.videoCodec || t('status.unavailable')} / {stream.audioCodec || t('status.unavailable')}</Property>
      <Property label={t('playback.bandwidth')}>{stream.bandwidth != null ? formatBandwidth(stream.bandwidth) : t('status.unavailable')}</Property>
      <Property label={t('playback.server')}>{stream.server || t('status.unavailable')}</Property>
    </dl></details>
  </article>;
}
