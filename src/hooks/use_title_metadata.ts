import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { stringValue } from '@/helpers/title_status';
import type { MediaType, MetadataPayload } from '@/types/title.types';

/** TMDb metadata for the title, plus the display title that every lookup waits for. */
export function useTitleMetadata(initialTitle: string, initialTmdbId: string, mediaType: MediaType) {
  const [details, setDetails] = useState<MetadataPayload | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(Boolean(initialTmdbId));
  const [resolvedTmdbId, setResolvedTmdbId] = useState(initialTmdbId);

  useEffect(() => {
    let current = true;
    setDetails(null);
    setResolvedTmdbId(initialTmdbId);
    setMetadataLoading(true);

    async function loadMetadata() {
      try {
        const tmdbId = initialTmdbId;
        if (!tmdbId) return;
        const payload = await apiRequest<MetadataPayload>(`/api/discovery/detail?id=${encodeURIComponent(tmdbId)}&type=${mediaType}`);
        if (current) {
          setDetails(payload);
          setResolvedTmdbId(tmdbId);
        }
      } catch {
        // Keep the dashboard data visible when TMDb metadata is unavailable.
      } finally {
        if (current) setMetadataLoading(false);
      }
    }

    void loadMetadata();
    return () => { current = false; };
  }, [initialTitle, initialTmdbId, mediaType]);

  // Empty until a real name is known (from the link that opened the page, or TMDb); lookups wait for it rather than search a placeholder.
  const title = stringValue(details?.title || details?.name) || initialTitle || (metadataLoading ? '' : 'Media details');
  return { details, metadataLoading, resolvedTmdbId, title };
}
