import { useState } from 'react';
import type { EpisodeDetailsProps } from './EpisodeDetails.types';
import { useLocale } from '@/lib/i18n';

export function EpisodeDetails({ episode, metadata, loading }: EpisodeDetailsProps) {
  const { t } = useLocale();
  const [stillState, setStillState] = useState<{ url: string; status: 'loaded' | 'failed' }>();
  const data = metadata?.data;
  const title = data?.name || episode.title || t('detail.episodeDetails');
  const overview = (data?.overview || '').trim() || (episode.overview || '').trim();
  const airDate = data?.air_date || episode.airDateUtc || '';
  const runtime = data?.runtime || episode.runtime || 0;
  const stillUrl = data?.still_path ? `/api/discovery-artwork?path=${encodeURIComponent(data.still_path)}` : '';
  const stillLoaded = stillState?.status === 'loaded' && stillState.url === stillUrl;
  const stillFailed = stillState?.status === 'failed' && stillState.url === stillUrl;
  const busy = loading || (Boolean(stillUrl) && !stillLoaded && !stillFailed);
  const skeleton = (short = false) => <span className={`episode-skeleton-value${short ? ' short' : ''}`} aria-hidden="true" />;

  return <div className="episode-expanded" aria-busy={busy}>
    <div className="episode-expanded-copy">
      <div className="episode-overview-slot">
        {loading ? <div className="episode-skeleton-copy" role="status" aria-label={t('detail.loadingSynopsis')}>{[0, 1, 2, 3, 4, 5].map((line) => <span className="episode-skeleton-line" key={line} />)}</div> : overview ? <p className="episode-overview">{overview}</p> : <p className="episode-detail-empty">{metadata?.status === 'unavailable' ? t('detail.episodeUnavailable') : t('detail.noSynopsis')}</p>}
      </div>
      <dl className="detail-list universal-episode-metadata">
        <div><dt>{t('detail.airDate')}</dt><dd>{airDate || (loading ? skeleton() : t('status.unavailable'))}</dd></div>
        <div><dt>{t('detail.runtime')}</dt><dd>{runtime ? t('detail.runtimeMinutes', undefined, { value: runtime }) : loading ? skeleton(true) : t('status.unavailable')}</dd></div>
        <div><dt>{t('detail.rating')}</dt><dd>{typeof data?.vote_average === 'number' ? `${data.vote_average.toFixed(1)} / 10` : loading ? skeleton(true) : t('status.unavailable')}</dd></div>
        <div className="episode-guests"><dt>{t('detail.guestStars')}</dt><dd>{data?.guest_stars?.length ? data.guest_stars.map((person) => person.name).filter(Boolean).join(', ') : loading ? skeleton() : t('status.unavailable')}</dd></div>
      </dl>
    </div>
    <div className="episode-still-slot">
      {stillUrl ? <>
        {!stillLoaded && !stillFailed ? <span className="episode-still-skeleton" role="status" aria-label={t('detail.loadingStill')} /> : null}
        {stillFailed ? <span>{t('detail.stillLoadFailed')}</span> : <img className={stillLoaded ? 'loaded' : 'loading'} src={stillUrl} alt={t('detail.stillFrom', undefined, { value: title })} onLoad={() => setStillState({ url: stillUrl, status: 'loaded' })} onError={() => setStillState({ url: stillUrl, status: 'failed' })} />}
      </> : loading ? <span className="episode-still-skeleton" role="status" aria-label={t('detail.loadingStill')} /> : <span>{t('detail.noStill')}</span>}
    </div>
  </div>;
}
