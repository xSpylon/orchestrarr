import type { DashboardItem, DiscoveryItem } from './dashboard.types.ts';

export type MediaType = 'tv' | 'movie';
export type DetailItem = DashboardItem & Partial<DiscoveryItem> & {
  mediaType?: string;
  overview?: string;
  poster_path?: string;
  posterPath?: string;
  jellyseerrUrl?: string;
  pipelineState?: string;
  date?: string;
  service?: string;
};
export type MetadataPayload = Record<string, unknown> & {
  credits?: { cast?: Array<{ id?: number; name?: string }> };
};
export type PlexLibraryMatch = { status: 'loading' | 'found' | 'missing' | 'unavailable' | 'unconfigured' | 'unresolved'; library?: string; ratingKey?: string; webUrl?: string; detail?: string };
export type ArrMediaMatch = { status: 'loading' | 'available' | 'tracked' | 'not-tracked' | 'unavailable' | 'unconfigured' | 'not-applicable' | 'unresolved'; detail?: string };
export type BazarrMediaStatus = { status: 'loading' | 'indexing' | 'complete' | 'missing' | 'not-tracked' | 'unavailable' | 'unconfigured' | 'unresolved'; detail?: string };
export type Ratings = { rottenTomatoes?: { critics?: number; audience?: number; url?: string }; imdb?: { score: number; votes?: number; url?: string }; metacritic?: { score: number } };
export type TautulliHistoryEntry = { title?: string; seriesTitle?: string; user?: string; platform?: string; watchedAt?: string | number; ratingKey?: string; grandparentRatingKey?: string };
export type TautulliHistory = { status: 'loading' | 'ready' | 'unavailable'; history: TautulliHistoryEntry[] };
export type ServiceRow = { name: string; url?: string; context: string; tone: string };
