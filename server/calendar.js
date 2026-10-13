// Sonarr only embeds the series (title, tmdbId) when asked; without it an episode would be titled by its own name.
export function calendarPath(service, start, end) {
  return `/api/v3/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${service === 'Sonarr' ? '&includeSeries=true' : ''}`;
}

// Radarr's calendar items are the movies themselves, so their tmdbId sits on the item, not under `movie`.
export function calendarEntry(item, service) {
  const isSeries = service === 'Sonarr';
  const media = isSeries ? item.series || {} : item.movie || item;
  const title = media.title || item.title;
  const episodeCode = `S${String(item.seasonNumber || 0).padStart(2, '0')} E${String(item.episodeNumber || 0).padStart(2, '0')}`;
  const episodeTitle = item.title && item.title !== title ? item.title : item.episodeTitle;
  return {
    service,
    title: title || 'Untitled',
    date: item.airDateUtc || item.digitalRelease || item.inCinemas || item.physicalRelease || '',
    type: isSeries ? 'episode' : 'movie',
    mediaType: isSeries ? 'tv' : 'movie',
    tmdbId: media.tmdbId || '',
    detail: isSeries ? [episodeCode, episodeTitle].filter(Boolean).join(' · ') : 'Release calendar',
    sourceId: isSeries ? item.seriesId || media.id || '' : item.movieId || media.id || ''
  };
}
