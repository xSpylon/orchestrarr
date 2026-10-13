import type { MediaType, Ratings } from '@/types/title.types';

export type TitleRatingsProps = {
  mediaType: MediaType;
  tmdbId: string;
  /** Formatted TMDb score, empty when TMDb has none. */
  tmdbRating: string;
  metadataLoading: boolean;
  ratings: Ratings;
  ratingsLoading: boolean;
};
