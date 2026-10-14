import type { DiscoveryItem } from '@/types/dashboard.types';
import { displayText } from './format.ts';

export type DiscoveryPayload = { results?: Array<Record<string, unknown>>; total_pages?: number };

export function adaptDiscovery(payload: DiscoveryPayload): DiscoveryItem[] {
  return (payload.results || []).filter((entry) => entry.media_type !== 'person').map((entry) => {
    const mediaType = String(entry.media_type || (entry.first_air_date ? 'tv' : 'movie'));
    const title = displayText(String(entry.title || entry.name || 'Untitled'));
    const posterPath = String(entry.poster_path || '');
    const directPoster = String(entry.poster || '');
    return {
      id: String(entry.id || ''), title,
      poster: directPoster || (posterPath ? `/api/discovery-artwork?size=w342&path=${encodeURIComponent(posterPath)}` : ''),
      posterPath,
      detail: String(entry.release_date || entry.first_air_date || ''),
      overview: String(entry.overview || 'No synopsis available.'),
      mediaType,
    };
  });
}

export function appendUnique(previous: DiscoveryItem[], items: DiscoveryItem[]): DiscoveryItem[] {
  return [...previous, ...items.filter((item) => !previous.some((existing) => existing.id === item.id && existing.mediaType === item.mediaType))];
}

/** While more pages exist, only complete rows show; the remainder waits for the next page so no row stops halfway. */
export function completeRows<T>(items: T[], columns: number, hasMore: boolean): T[] {
  const fullRows = Math.floor(items.length / columns) * columns;
  return hasMore && fullRows ? items.slice(0, fullRows) : items;
}
