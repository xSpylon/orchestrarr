import type { MediaFocus } from '@/lib/navigation';
import type { TitleSynopsisProps } from './TitleSynopsis.types';
import { useLocale } from '@/lib/i18n';

function focusLine(focus: MediaFocus, episodeTitle: string, t: ReturnType<typeof useLocale>['t']): string {
  if (focus.kind !== 'episode') return t('detail.seasonFocus', undefined, { value: focus.seasonNumber === 0 ? t('detail.specials') : t('detail.season', undefined, { value: focus.seasonNumber ?? '?' }) });
  return t('detail.episodeFocus', undefined, { season: focus.seasonNumber ?? '?', episode: focus.episodeNumber !== undefined ? `, ${t('detail.episodeNumber', undefined, { value: focus.episodeNumber })}` : '', title: episodeTitle !== t('detail.episodeDetails') ? ` · ${episodeTitle}` : '' });
}

export function TitleSynopsis({ loading, overview, focus, episodeTitle }: TitleSynopsisProps) {
  const { t } = useLocale();
  return <>
    {loading ? <div className="episode-skeleton-copy discovery-overview" role="status" aria-label={t('detail.loadingSynopsis')}>{[0, 1, 2].map((line) => <span className="episode-skeleton-line" key={line} />)}</div> : <p className="discovery-overview">{overview}</p>}
    {focus ? <p className="universal-media-focus">{focusLine(focus, episodeTitle, t)}</p> : null}
  </>;
}
