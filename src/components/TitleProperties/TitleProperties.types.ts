import type { titleFacts } from '@/helpers/title_status';
import type { MediaType, Ratings } from '@/types/title.types';

export type TitlePropertiesProps = {
  mediaType: MediaType;
  facts: ReturnType<typeof titleFacts>;
  /** The TMDb ID the page resolved, used when the metadata has none. */
  tmdbId: string;
  metadataLoading: boolean;
  ratings: Ratings;
  ratingsLoading: boolean;
  statusResolved: boolean;
  isAvailable: boolean;
  requestState: string;
  pipelineState: string;
};
