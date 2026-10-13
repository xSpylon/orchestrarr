// Radarr and Sonarr route their web pages by slug (Radarr's movie slug is the TMDb id), not by their internal database id.
export function arrMediaUrl(base, service, media = {}) {
  const slug = media.titleSlug || (service === 'Radarr' ? media.tmdbId : '');
  if (!slug) return base;
  return `${base}/${service === 'Radarr' ? 'movie' : 'series'}/${encodeURIComponent(String(slug))}`;
}
