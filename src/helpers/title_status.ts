import type { ActivityItem, AvailabilityEpisode, DashboardData, DashboardItem, SeriesAvailability, Stream } from '../types/dashboard.types.ts';
import type { MediaFocus } from '../lib/navigation.ts';
import type { ArrMediaMatch, BazarrMediaStatus, DetailItem, MediaType, MetadataPayload, PlexLibraryMatch, ServiceRow, TautulliHistory, TautulliHistoryEntry } from '../types/title.types.ts';
import { formatVotes, statusTone } from './format.ts';

export const requestStages = ['Requested', 'Approved', 'Searching', 'Downloading', 'Available'];

export function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function mediaTypeOf(item: DetailItem): MediaType {
  const type = `${stringValue(item.mediaType)} ${stringValue(item.type)} ${stringValue(item.detail)}`.toLowerCase();
  return /series|\btv\b|episode|show/.test(type) ? 'tv' : 'movie';
}

export function recordMatches(item: DashboardItem, tmdbId: string, type: MediaType): boolean {
  const candidate = item as DetailItem;
  return Boolean(tmdbId && stringValue(candidate.mediaType) === type && String(candidate.tmdbId || '') === tmdbId);
}

export function genreNames(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map((genre) => typeof genre === 'string' ? genre : stringValue((genre as { name?: unknown })?.name)).filter(Boolean).join(', ');
}

export function stageIndex(state: string): number {
  const normalized = state.toLowerCase();
  if (normalized.includes('available') || normalized.includes('completed')) return 4;
  if (normalized.includes('download') || normalized.includes('stalled')) return 3;
  if (normalized.includes('search')) return 2;
  if (normalized.includes('approv')) return 1;
  if (normalized.includes('request') || normalized.includes('pending') || normalized.includes('queue')) return 0;
  return -1;
}

export function serviceHealth(dashboard: DashboardData, name: string): string {
  const service = dashboard.services?.find((entry) => `${entry.service || ''} ${entry.name}`.toLowerCase().includes(name.toLowerCase()));
  return service?.state || '';
}

export function findFocusedEpisode(availability: SeriesAvailability, focus?: MediaFocus): AvailabilityEpisode | undefined {
  return focus?.kind === 'episode' && focus.seasonNumber !== undefined && focus.episodeNumber !== undefined
    ? availability.series?.seasons.find((season) => season.seasonNumber === focus.seasonNumber)?.episodes.find((episode) => episode.episodeNumber === focus.episodeNumber)
    : undefined;
}

/** Display values from TMDb metadata; `poster` is the artwork the page was opened with. */
export function titleFacts(details: MetadataPayload | null, poster: string) {
  const release = stringValue(details?.release_date || details?.first_air_date) || 'Release date unavailable';
  const runtimeValue = details?.runtime || (Array.isArray(details?.episode_run_time) ? details.episode_run_time[0] : '');
  const voteCount = typeof details?.vote_count === 'number' ? details.vote_count : 0;
  const posterPath = stringValue(details?.poster_path);
  return {
    release,
    year: release.match(/\d{4}/)?.[0] || '',
    genres: genreNames(details?.genres),
    runtime: runtimeValue ? `${runtimeValue} min` : '',
    rating: typeof details?.vote_average === 'number' && voteCount ? `${details.vote_average.toFixed(1)} / 10 · ${formatVotes(voteCount)} votes` : '',
    cast: (details?.credits?.cast || []).filter((person) => person.name).slice(0, 5),
    overview: stringValue(details?.overview) || 'Detailed synopsis is unavailable from TMDb.',
    tmdbId: stringValue(details?.id),
    // The poster that was clicked to get here shows straight away (and is what the transition morphs into); TMDb's is the fallback.
    image: poster || (posterPath ? `/api/discovery-artwork?path=${encodeURIComponent(posterPath)}` : ''),
  };
}

/** The dashboard's requests, queue entries and activity that belong to this title. */
export function matchTitleRecords(dashboard: Pick<DashboardData, 'requests' | 'pipeline' | 'activity'>, tmdbId: string, mediaType: MediaType) {
  const relatedRequest = dashboard.requests?.find((entry) => recordMatches(entry, tmdbId, mediaType));
  const candidates = [...(dashboard.pipeline || []), ...((relatedRequest?.pipelineItems as DashboardItem[] | undefined) || [])];
  const matchedPipeline = candidates.filter((entry, index) => recordMatches(entry, tmdbId, mediaType) && candidates.findIndex((candidate) => candidate.service === entry.service && candidate.sourceId === entry.sourceId) === index);
  const activity = (Array.isArray(dashboard.activity) ? dashboard.activity : []).filter((entry) => {
    const candidate = entry as ActivityItem & { tmdbId?: unknown; mediaType?: unknown };
    return Boolean(tmdbId && stringValue(candidate.tmdbId) === tmdbId && stringValue(candidate.mediaType) === mediaType);
  }).slice(0, 6);
  return { relatedRequest, matchedPipeline, activity };
}

export type TitleStatusInput = {
  dashboard: DashboardData;
  mediaType: MediaType;
  relatedRequest?: DashboardItem;
  matchedPipeline: DashboardItem[];
  seriesAvailability: SeriesAvailability;
  availabilityLoading: boolean;
  arrMediaMatch: ArrMediaMatch;
  plexLibraryMatch: PlexLibraryMatch;
  bazarrMediaStatus: BazarrMediaStatus;
  tautulliHistory: TautulliHistory;
  playback: TautulliHistoryEntry[];
  activeStreams: Stream[];
  requestSubmitted: boolean;
};

function episodeCounts(seasons: Array<{ episodeFileCount: number; totalEpisodeCount: number }>) {
  return {
    available: seasons.reduce((sum, season) => sum + season.episodeFileCount, 0),
    total: seasons.reduce((sum, season) => sum + season.totalEpisodeCount, 0),
  };
}

export function deriveTitleStatus({ dashboard, mediaType, relatedRequest, matchedPipeline, seriesAvailability, availabilityLoading, arrMediaMatch, plexLibraryMatch, bazarrMediaStatus, tautulliHistory, playback, activeStreams, requestSubmitted }: TitleStatusInput) {
  const requestState = stringValue(relatedRequest?.state);
  const targetService = mediaType === 'tv' ? 'Sonarr' : 'Radarr';
  const targetPipeline = matchedPipeline.find((entry) => String(entry.service || '').toLowerCase().includes(targetService.toLowerCase()));
  const pipelineState = stringValue(targetPipeline?.state || matchedPipeline[0]?.state || (relatedRequest as DetailItem | undefined)?.pipelineState || requestState);
  const currentStage = Math.max(stageIndex(requestState), stageIndex(`${pipelineState} ${stringValue(targetPipeline?.detail)}`), targetPipeline ? 2 : -1);
  const availabilitySeries = seriesAvailability.series;
  const sonarrSeries = availabilitySeries?.source === 'sonarr' ? availabilitySeries : null;

  // null means "not known yet", so nothing is claimed missing while it is only loading or unresolved.
  let targetPresent: boolean | null;
  if (mediaType === 'tv') {
    if (availabilityLoading || seriesAvailability.sonarrUnavailable) targetPresent = null;
    else if (sonarrSeries) {
      const { available, total } = episodeCounts(sonarrSeries.seasons);
      targetPresent = total === 0 || available >= total;
    } else if (seriesAvailability.sonarrMatchUnresolved) targetPresent = null;
    else targetPresent = seriesAvailability.configured ? false : null;
  } else if (targetPipeline) targetPresent = stageIndex(stringValue(targetPipeline.state)) === 4;
  else if (arrMediaMatch.status === 'available') targetPresent = true;
  else if (arrMediaMatch.status === 'tracked' || arrMediaMatch.status === 'not-tracked') targetPresent = false;
  else targetPresent = null;

  let targetContext: string;
  if (mediaType === 'tv') {
    if (availabilityLoading) targetContext = 'Checking Sonarr availability';
    else if (availabilitySeries) {
      if (availabilitySeries.source === 'tmdb') targetContext = `TMDb guide · ${availabilitySeries.seasons.length} seasons`;
      else {
        const { available, total } = episodeCounts(availabilitySeries.seasons);
        targetContext = `${availabilitySeries.seasons.length} seasons${total ? ` · ${available}/${total} episodes` : ''}`;
      }
    } else if (seriesAvailability.sonarrUnavailable) targetContext = 'Sonarr availability unavailable';
    else if (seriesAvailability.sonarrMatchUnresolved) targetContext = 'Sonarr match could not be confirmed by TMDb ID';
    else targetContext = seriesAvailability.configured ? 'No matching series in Sonarr' : 'Sonarr not configured';
  } else if (targetPipeline) {
    targetContext = `${stringValue(targetPipeline.state) || 'In queue'}${stageIndex(stringValue(targetPipeline.state)) === 3 && typeof targetPipeline.progress === 'number' ? ` · ${targetPipeline.progress}%` : ''}`;
  } else targetContext = arrMediaMatch.detail || (arrMediaMatch.status === 'loading' ? 'Checking Radarr library' : 'Radarr lookup unavailable');

  const isAvailable = plexLibraryMatch.status === 'found' || targetPresent === true || requestState.toLowerCase().includes('available') || pipelineState.toLowerCase().includes('available');
  // Status and progress wait for Plex and Radarr/Sonarr, unless a request or queue already says Available: never "Not requested" while still checking.
  const statusResolved = isAvailable || (plexLibraryMatch.status !== 'loading' && (mediaType === 'tv' ? !availabilityLoading : arrMediaMatch.status !== 'loading'));
  const targetMatchUnresolved = mediaType === 'tv' ? seriesAvailability.sonarrMatchUnresolved : arrMediaMatch.status === 'unresolved';
  const showRequestAction = !requestSubmitted && !relatedRequest && plexLibraryMatch.status === 'missing' && targetPresent !== true && !targetMatchUnresolved;

  const links = dashboard.links || {};
  const plexContext = plexLibraryMatch.status === 'found' ? `In ${plexLibraryMatch.library || 'library'}`
    : plexLibraryMatch.status === 'missing' ? 'Not in Plex library'
      : plexLibraryMatch.status === 'unconfigured' ? 'Plex not configured'
        : plexLibraryMatch.status === 'unresolved' ? plexLibraryMatch.detail || 'Could not confirm a Plex match by TMDb ID'
          : plexLibraryMatch.status === 'unavailable' ? 'Library lookup unavailable' : 'Checking library';
  const rows = [
    { name: 'Jellyseerr', url: links.jellyseerr ? `${links.jellyseerr.replace(/\/$/, '')}/discover` : '', context: relatedRequest ? `${requestState || 'Requested'} · ${stringValue(relatedRequest.requester) || 'Requester unavailable'}` : 'No linked request', health: serviceHealth(dashboard, 'jellyseerr'), present: Boolean(relatedRequest && stageIndex(requestState) === 4) },
    { name: targetService, url: links[targetService.toLowerCase()], context: targetContext, health: serviceHealth(dashboard, targetService), present: targetPresent },
    { name: 'Bazarr', url: links.bazarr, context: bazarrMediaStatus.detail || (bazarrMediaStatus.status === 'loading' ? 'Checking subtitle status' : 'Subtitle status unavailable'), health: bazarrMediaStatus.status === 'missing' ? 'Attention' : serviceHealth(dashboard, 'bazarr'), present: bazarrMediaStatus.status === 'complete' ? true : bazarrMediaStatus.status === 'missing' ? false : null },
    { name: 'Plex', url: links.plex, context: plexContext, health: serviceHealth(dashboard, 'plex'), present: plexLibraryMatch.status === 'found' ? true : plexLibraryMatch.status === 'missing' ? false : null },
    { name: 'Tautulli', url: links.tautulli, context: activeStreams.length ? 'Playing now' : tautulliHistory.status === 'loading' ? 'Checking playback history' : tautulliHistory.status === 'unavailable' ? 'History lookup unavailable' : playback.length ? 'In playback history' : 'No matching playback', health: serviceHealth(dashboard, 'tautulli'), present: activeStreams.length > 0 || playback.length > 0 ? true : tautulliHistory.status === 'ready' ? false : null },
  ];
  const jellyseerrState = requestState.toLowerCase();
  const serviceRows: ServiceRow[] = rows.map(({ name, url, context, health, present }) => {
    const healthTone = health ? statusTone(health) : 'muted';
    const requestTone = name === 'Jellyseerr' && relatedRequest
      ? ['pending', 'requested'].some((state) => jellyseerrState.includes(state)) ? 'warn'
        : ['declined', 'failed'].some((state) => jellyseerrState.includes(state)) ? 'bad'
          : 'good'
      : '';
    const tone = requestTone || (healthTone === 'good'
      ? present === true ? 'good' : present === false ? 'media' : 'muted'
      : healthTone);
    return { name, url, context, tone };
  });

  return {
    requestState,
    pipelineState,
    currentStage,
    // Available is the final stage: once reached, every step is done instead of one still in progress.
    progressStage: isAvailable ? requestStages.length : currentStage,
    isAvailable,
    statusResolved,
    showRequestAction,
    serviceRows,
  };
}
