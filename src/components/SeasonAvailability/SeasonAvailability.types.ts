import type { MediaFocus } from '@/lib/navigation';
import type { SeriesAvailability } from '@/types/dashboard.types';
import type { EpisodeMetadataState } from '@/components/EpisodeDetails/EpisodeDetails.types';

export type SonarrSearchScope = 'series' | 'season' | 'episode';
export type SeasonAvailabilityProps = {
  availability: SeriesAvailability;
  loading: boolean;
  hasTmdbId: boolean;
  focus?: MediaFocus;
  onFocusChange?: (focus?: MediaFocus) => void;
  /** Key of the Sonarr search in flight, e.g. `season:2`; empty when idle. */
  searchAction: string;
  onSearch: (seriesId: number, scope: SonarrSearchScope, seasonNumber?: number, episodeId?: number) => void;
  episodeMetadata?: EpisodeMetadataState;
  episodeLoading: boolean;
};
