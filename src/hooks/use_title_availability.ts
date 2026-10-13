import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { SeriesAvailability } from '@/types/dashboard.types';
import type { SonarrSearchScope } from '@/components/SeasonAvailability/SeasonAvailability.types';
import type { MediaType } from '@/types/title.types';

/** Sonarr season/episode availability for a series, and the Sonarr searches started from it. */
export function useTitleAvailability(mediaType: MediaType, resolvedTmdbId: string, title: string, requestSubmitted: boolean, onToast: (message: string) => void, refreshKey = '') {
  const [seriesAvailability, setSeriesAvailability] = useState<SeriesAvailability>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(mediaType === 'tv');
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  const [availabilityAction, setAvailabilityAction] = useState('');

  useEffect(() => {
    if (mediaType !== 'tv') {
      setSeriesAvailability({});
      setAvailabilityLoading(false);
      return;
    }
    if (!title) return;
    let current = true;
    setAvailabilityLoading(true);
    const params = new URLSearchParams({ tmdbId: resolvedTmdbId, title });
    apiRequest<SeriesAvailability>(`/api/series/availability?${params}`)
      .then((payload) => { if (current) setSeriesAvailability(payload || {}); })
      .catch(() => { if (current) setSeriesAvailability({ sonarrUnavailable: true, configured: true }); })
      .finally(() => { if (current) setAvailabilityLoading(false); });
    return () => { current = false; };
  }, [availabilityRevision, mediaType, resolvedTmdbId, title, requestSubmitted, refreshKey]);

  async function searchSonarr(seriesId: number, scope: SonarrSearchScope, seasonNumber?: number, episodeId?: number) {
    const actionKey = `${scope}:${seasonNumber ?? episodeId ?? 'all'}`;
    setAvailabilityAction(actionKey);
    const params = new URLSearchParams({ seriesId: String(seriesId), scope });
    if (seasonNumber !== undefined) params.set('seasonNumber', String(seasonNumber));
    if (episodeId !== undefined) params.set('episodeId', String(episodeId));
    try {
      await apiRequest(`/api/actions/search-sonarr-availability?${params}`, { method: 'POST' });
      onToast(`Sonarr ${scope} search started`);
      window.setTimeout(() => setAvailabilityRevision((revision) => revision + 1), 1800);
    } catch (cause) {
      onToast(`Sonarr search failed · ${cause instanceof Error ? cause.message : 'Request failed'}`);
    } finally {
      setAvailabilityAction('');
    }
  }

  return { seriesAvailability, availabilityLoading, availabilityAction, searchSonarr };
}
