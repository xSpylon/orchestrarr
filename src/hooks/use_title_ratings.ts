import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { MediaType, Ratings } from '@/types/title.types';

export function useTitleRatings(mediaType: MediaType, resolvedTmdbId: string) {
  const [ratings, setRatings] = useState<Ratings>({});
  const [ratingsLoading, setRatingsLoading] = useState(Boolean(resolvedTmdbId));

  useEffect(() => {
    let current = true;
    setRatings({});
    setRatingsLoading(Boolean(resolvedTmdbId));
    if (!resolvedTmdbId) return () => { current = false; };
    apiRequest<Ratings>(`/api/ratings?type=${mediaType}&tmdbId=${encodeURIComponent(resolvedTmdbId)}`)
      .then((result) => { if (current) setRatings(result || {}); })
      .catch(() => { /* Ratings are extra context; the page works without them. */ })
      .finally(() => { if (current) setRatingsLoading(false); });
    return () => { current = false; };
  }, [mediaType, resolvedTmdbId]);

  return { ratings, ratingsLoading };
}
