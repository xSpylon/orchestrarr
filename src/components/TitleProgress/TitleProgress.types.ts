import type { DashboardItem } from '@/types/dashboard.types';
import type { PlexLibraryMatch } from '@/types/title.types';

export type TitleProgressProps = {
  relatedRequest?: DashboardItem;
  plexLibraryMatch: PlexLibraryMatch;
  /** Furthest request stage seen, -1 when unknown. */
  currentStage: number;
  /** Stage shown as current; past the last step once the title is available. */
  progressStage: number;
  matchedPipeline: DashboardItem[];
};
