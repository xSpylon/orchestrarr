import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import type { ArrMediaMatch, MediaType } from '@/types/title.types';

/** Whether Radarr has the movie; series use Sonarr availability instead. */
export function useTitleArrMatch(mediaType: MediaType, resolvedTmdbId: string, title: string, requestSubmitted: boolean, refreshKey = '') {
  const { t } = useLocale();
  const [arrMediaMatch, setArrMediaMatch] = useState<ArrMediaMatch>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    if (mediaType !== 'movie') {
      setArrMediaMatch({ status: 'not-applicable' });
      return () => { current = false; };
    }
    setArrMediaMatch({ status: 'loading' });
    if (!title) return () => { current = false; };
    apiRequest<ArrMediaMatch>(`/api/arr/media-match?type=movie&tmdbId=${encodeURIComponent(resolvedTmdbId)}&title=${encodeURIComponent(title)}`)
      .then((result) => { if (current) setArrMediaMatch(result || { status: 'unavailable', detail: t('detail.radarrUnavailable') }); })
      .catch(() => { if (current) setArrMediaMatch({ status: 'unavailable', detail: t('detail.radarrUnavailable') }); });
    return () => { current = false; };
  }, [mediaType, resolvedTmdbId, title, requestSubmitted, refreshKey, t]);

  return arrMediaMatch;
}
