import type { DashboardItem } from '@/types/dashboard.types';

export type LibraryItem = DashboardItem & { grandparentTitle?: string; grandparentRatingKey?: string; episodeCount?: number };
export type RecentShowItem = LibraryItem & { recentDetail?: string };
export type LibraryKind = 'movie' | 'show';

export function mediaKind(item: LibraryItem): LibraryKind | null {
  const type = String(item.type || '').toLowerCase();
  const library = String(item.library || '').toLowerCase();
  if (type === 'movie' || library.includes('movie')) return 'movie';
  if (['show', 'series', 'tv', 'episode', 'season'].includes(type) || /show|series|tv/.test(library)) return 'show';
  return null;
}

/** Recent episodes collapse into one card per show, with the show's artwork. */
export function recentShows(items: LibraryItem[]): RecentShowItem[] {
  const shows = new Map<string, RecentShowItem>();
  for (const item of items) {
    const showTitle = item.grandparentTitle || item.title;
    const showRatingKey = item.grandparentRatingKey || item.ratingKey || showTitle;
    if (!showTitle || shows.has(showRatingKey)) continue;
    shows.set(showRatingKey, {
      ...item,
      title: showTitle,
      type: 'show',
      ratingKey: item.grandparentRatingKey || item.ratingKey,
      thumb: item.grandparentRatingKey ? `/api/media/${encodeURIComponent(item.grandparentRatingKey)}/artwork` : item.thumb,
      recentDetail: item.grandparentTitle ? `New episode · ${item.title}` : 'Recently added'
    });
  }
  return [...shows.values()];
}
