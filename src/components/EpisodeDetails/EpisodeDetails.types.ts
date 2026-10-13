import type { AvailabilityEpisode, EpisodeMetadata } from '@/types/dashboard.types';

export type EpisodeMetadataState = { key: string; status: 'loading' | 'ready' | 'unavailable'; data?: EpisodeMetadata };
export type EpisodeDetailsProps = {
  episode: AvailabilityEpisode;
  /** TMDb metadata for this episode, once the page has requested it. */
  metadata?: EpisodeMetadataState;
  loading: boolean;
};
