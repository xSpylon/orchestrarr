import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { MediaType, PlexLibraryMatch } from '@/types/title.types';

export function useTitlePlexMatch(mediaType: MediaType, resolvedTmdbId: string, title: string, refreshKey = '') {
  const [plexLibraryMatch, setPlexLibraryMatch] = useState<PlexLibraryMatch>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    setPlexLibraryMatch({ status: 'loading' });
    if (!title) return () => { current = false; };
    apiRequest<PlexLibraryMatch>(`/api/plex/library-match?type=${mediaType}&tmdbId=${encodeURIComponent(resolvedTmdbId)}&title=${encodeURIComponent(title)}`)
      .then((result) => { if (current) setPlexLibraryMatch(result); })
      .catch(() => { if (current) setPlexLibraryMatch({ status: 'unavailable' }); });
    return () => { current = false; };
  }, [mediaType, resolvedTmdbId, title, refreshKey]);

  return plexLibraryMatch;
}
