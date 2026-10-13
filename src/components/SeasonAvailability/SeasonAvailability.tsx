import { useEffect, useRef } from 'react';
import { statusTone } from '@/helpers/format';
import { QUEUE_PROBLEM, canSearchEpisode, episodeStatus } from '@/helpers/episodes';
import { EpisodeDetails } from '@/components/EpisodeDetails/EpisodeDetails';
import type { SeasonAvailabilityProps } from './SeasonAvailability.types';
import { Button } from '@/components/Button/Button';
import { useLocale } from '@/lib/i18n';

export function SeasonAvailability({ availability, loading, hasTmdbId, focus, onFocusChange, searchAction, onSearch, episodeMetadata, episodeLoading }: SeasonAvailabilityProps) {
  const { t } = useLocale();
  const episodeDetailRef = useRef<HTMLDetailsElement | null>(null);
  const series = availability.series;
  const seriesId = series?.source !== 'tmdb' ? series?.seriesId : undefined;

  useEffect(() => {
    if (focus?.kind === 'episode') episodeDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focus?.kind, focus?.seasonNumber, focus?.episodeNumber]);

  const episodeCounts = series ? t('detail.episodesAvailable', undefined, { available: series.seasons.reduce((count, season) => count + season.episodeFileCount, 0), total: series.seasons.reduce((count, season) => count + season.totalEpisodeCount, 0) }) : '';
  const emptyMessage = availability.tmdbGuideUnavailable ? t('detail.tmdbGuideUnavailable')
    : !hasTmdbId ? t('detail.tmdbIdRequired')
      : !availability.configured ? t('detail.tmdbGuideOnly')
        : availability.sonarrUnavailable ? t('detail.sonarrAvailabilityUnavailable')
          : t('detail.noEpisodeGuide');

  return <section className="universal-media-section universal-season-availability">
    <div className="section-head"><div><h2>{t('detail.seasonAvailability')}</h2>{!loading && series ? <p>{series.source === 'tmdb' ? t('detail.tmdbGuideSource') : episodeCounts}</p> : null}</div>{!loading && seriesId != null ? <Button className="season-search-button" disabled={Boolean(searchAction)} onClick={() => onSearch(seriesId, 'series')}>{searchAction === 'series:all' ? t('detail.searching') : t('detail.searchShow')}</Button> : null}</div>
    {loading ? <div className="empty-state">{t('detail.loadingAvailability')}</div> : series ? <div className="season-source-list"><div className="season-source">
      <div className="season-list">{series.seasons.map((season) => {
        const isTmdbGuide = series.source === 'tmdb';
        const missingCount = isTmdbGuide ? 0 : season.episodes.filter((episode) => episodeStatus(episode) === 'Missing').length;
        const queuedCount = season.episodes.filter((episode) => episode.queue && !QUEUE_PROBLEM.test(episode.queue.status)).length;
        const attentionCount = season.episodes.filter((episode) => episode.queue && QUEUE_PROBLEM.test(episode.queue.status)).length;
        const seasonOpen = focus?.seasonNumber === season.seasonNumber;
        return <div className={`season-card-row${missingCount ? ' has-season-search' : ''}`} key={season.seasonNumber}>
          <details className="season-card" open={seasonOpen}>
            <summary onClick={(event) => {
              event.preventDefault();
              onFocusChange?.(seasonOpen ? undefined : { kind: 'season', seasonNumber: season.seasonNumber });
            }}><strong>{season.seasonNumber === 0 ? t('detail.specials') : t('detail.season', undefined, { value: season.seasonNumber })}</strong><span>{isTmdbGuide ? t('detail.episodesNotTracked', undefined, { value: season.totalEpisodeCount }) : [t('detail.seasonCounts', undefined, { available: season.episodeFileCount, total: season.totalEpisodeCount }), missingCount ? t('detail.missingCount', undefined, { value: missingCount }) : '', queuedCount ? t('detail.queuedCount', undefined, { value: queuedCount }) : '', attentionCount ? t('detail.attentionCount', undefined, { value: attentionCount }) : ''].filter(Boolean).join(' · ')}</span></summary>
            <div className="episode-list">{season.episodes.map((episode) => {
              const label = episodeStatus(episode);
              const tone = label === 'Upcoming' || label === 'Unmonitored' || label === 'Not tracked' ? 'muted' : statusTone(label);
              const focused = focus?.kind === 'episode' && seasonOpen && focus.episodeNumber === episode.episodeNumber;
              return <div className={`episode-row${focused ? ' focused' : ''}`} key={`${season.seasonNumber}-${episode.episodeNumber}`}>
                <details className="episode-accordion" open={focused} ref={focused ? episodeDetailRef : null}>
                  <summary onClick={(event) => {
                    event.preventDefault();
                    onFocusChange?.(focused
                      ? { kind: 'season', seasonNumber: season.seasonNumber }
                      : { kind: 'episode', seasonNumber: season.seasonNumber, episodeNumber: episode.episodeNumber });
                  }}>
                    <span className="episode-code">S{String(season.seasonNumber).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')}</span>
                    <span className="episode-description"><span className="episode-title">{episode.title}</span>{episode.queue?.detail ? <small>{episode.queue.detail}</small> : null}</span>
                    <span className={`episode-availability ${tone}`}>{label}{episode.queue?.status === 'Downloading' ? ` · ${episode.queue.progress}%` : ''}</span>
                  </summary>
                  {focused ? <EpisodeDetails episode={episode} metadata={episodeMetadata} loading={episodeLoading} /> : null}
                </details>
                {canSearchEpisode(episode) && series.seriesId != null ? <Button variant="ghost" size="small" className="episode-search-button" disabled={Boolean(searchAction)} onClick={() => onSearch(series.seriesId!, 'episode', undefined, episode.id)}>{searchAction === `episode:${episode.id}` ? t('detail.searching') : episode.queue ? t('dataTable.searchAgain') : t('common.open', 'Search')}</Button> : null}
              </div>;
            })}</div>
          </details>
          {missingCount && series.seriesId != null ? <Button size="small" className="season-search-button" disabled={Boolean(searchAction)} onClick={() => onSearch(series.seriesId!, 'season', season.seasonNumber)}>{searchAction === `season:${season.seasonNumber}` ? t('detail.searching') : t('detail.searchSeason')}</Button> : null}
        </div>;
      })}</div>
    </div>{availability.sonarrUnavailable ? <div className="availability-note">{t('detail.sonarrUnavailable')}</div> : null}</div> : <div className="empty-state">{emptyMessage}</div>}
  </section>;
}
