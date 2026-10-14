import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import type { MediaFocus } from '@/lib/navigation';
import type { AvailabilityEpisode, SeriesAvailability } from '@/types/dashboard.types';
import type { BazarrMediaStatus, MediaType } from '@/types/title.types';

/** Bazarr subtitle status, narrowed to the Sonarr series and focused episode when known. */
export function useTitleBazarr(mediaType: MediaType, resolvedTmdbId: string, title: string, series: SeriesAvailability['series'], focus: MediaFocus | undefined, selectedEpisode: AvailabilityEpisode | undefined) {
  const { t } = useLocale();
  const [bazarrMediaStatus, setBazarrMediaStatus] = useState<BazarrMediaStatus>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    setBazarrMediaStatus({ status: 'loading' });
    if (!title) return () => { current = false; };
    const params = new URLSearchParams({ type: mediaType, tmdbId: resolvedTmdbId, title });
    if (mediaType === 'tv' && series?.source === 'sonarr' && series.seriesId) {
      params.set('seriesId', String(series.seriesId));
    }
    if (mediaType === 'tv' && series?.source === 'sonarr' && focus?.kind === 'episode' && selectedEpisode?.id) params.set('episodeId', String(selectedEpisode.id));
    apiRequest<BazarrMediaStatus>(`/api/bazarr/media-status?${params}`)
      .then((result) => { if (current) setBazarrMediaStatus(result?.status ? result : { status: 'unavailable', detail: t('detail.subtitleApiInactive') }); })
      .catch((cause) => { if (current) setBazarrMediaStatus({ status: 'unavailable', detail: cause instanceof Error ? t('detail.subtitleLookupFailedReason', undefined, { reason: cause.message }) : t('detail.subtitleLookupFailed') }); });
    return () => { current = false; };
  }, [focus?.kind, mediaType, resolvedTmdbId, selectedEpisode?.id, series?.seriesId, series?.source, title, t]);

  return bazarrMediaStatus;
}
