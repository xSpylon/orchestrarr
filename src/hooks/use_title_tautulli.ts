import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { Stream } from '@/types/dashboard.types';
import type { MediaType, PlexLibraryMatch, TautulliHistory, TautulliHistoryEntry } from '@/types/title.types';

/** Tautulli playback history and live streams for the Plex item this title matched. */
export function useTitleTautulli(mediaType: MediaType, title: string, plexLibraryMatch: PlexLibraryMatch, streams: Stream[] | undefined, refreshKey = '') {
  const [tautulliHistory, setTautulliHistory] = useState<TautulliHistory>({ status: 'loading', history: [] });

  useEffect(() => {
    let current = true;
    setTautulliHistory({ status: 'loading', history: [] });
    // Until Plex has answered there is nothing to look up yet; that is loading, not "no playback".
    if (plexLibraryMatch.status === 'loading') return () => { current = false; };
    if (!plexLibraryMatch.ratingKey) {
      setTautulliHistory({ status: 'ready', history: [] });
      return () => { current = false; };
    }
    apiRequest<{ history?: TautulliHistoryEntry[] }>(`/api/tautulli/title-history?type=${mediaType}&title=${encodeURIComponent(title)}&ratingKey=${encodeURIComponent(plexLibraryMatch.ratingKey || '')}`)
      .then((result) => { if (current) setTautulliHistory({ status: 'ready', history: Array.isArray(result?.history) ? result.history : [] }); })
      .catch(() => { if (current) setTautulliHistory({ status: 'unavailable', history: [] }); });
    return () => { current = false; };
  }, [mediaType, plexLibraryMatch.ratingKey, plexLibraryMatch.status, title, refreshKey]);

  const playback = useMemo(() => tautulliHistory.history.slice(0, 4), [tautulliHistory.history]);
  const activeStreams = useMemo(() => (Array.isArray(streams) ? streams : []).filter((entry) => Boolean(plexLibraryMatch.ratingKey && [entry.ratingKey, entry.grandparentRatingKey].some((key) => String(key || '') === String(plexLibraryMatch.ratingKey)))), [streams, plexLibraryMatch.ratingKey]);
  return { tautulliHistory, playback, activeStreams };
}
