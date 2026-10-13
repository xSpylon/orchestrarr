import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { MediaFocus } from '@/lib/navigation';
import type { EpisodeMetadata } from '@/types/dashboard.types';
import type { EpisodeMetadataState } from '@/components/EpisodeDetails/EpisodeDetails.types';

/** TMDb metadata for the focused episode; a stale answer for another episode is never returned. */
export function useTitleEpisodeMetadata(focus: MediaFocus | undefined, resolvedTmdbId: string) {
  const [episodeMetadata, setEpisodeMetadata] = useState<EpisodeMetadataState>();

  useEffect(() => {
    if (focus?.kind !== 'episode' || focus.seasonNumber === undefined || focus.episodeNumber === undefined || !resolvedTmdbId) {
      setEpisodeMetadata(undefined);
      return;
    }
    const key = `${resolvedTmdbId}:${focus.seasonNumber}:${focus.episodeNumber}`;
    let current = true;
    setEpisodeMetadata({ key, status: 'loading' });
    apiRequest<EpisodeMetadata>(`/api/series/episode-detail?tmdbId=${encodeURIComponent(resolvedTmdbId)}&seasonNumber=${focus.seasonNumber}&episodeNumber=${focus.episodeNumber}`)
      .then((data) => { if (current) setEpisodeMetadata({ key, status: 'ready', data }); })
      .catch(() => { if (current) setEpisodeMetadata({ key, status: 'unavailable' }); });
    return () => { current = false; };
  }, [focus?.kind, focus?.seasonNumber, focus?.episodeNumber, resolvedTmdbId]);

  const episodeMetadataKey = focus?.kind === 'episode' && focus.seasonNumber !== undefined && focus.episodeNumber !== undefined
    ? `${resolvedTmdbId}:${focus.seasonNumber}:${focus.episodeNumber}`
    : '';
  const metadata = episodeMetadata?.key === episodeMetadataKey ? episodeMetadata : undefined;
  const loading = focus?.kind === 'episode' && Boolean(resolvedTmdbId) && (!metadata || metadata.status === 'loading');
  return { metadata, loading };
}
