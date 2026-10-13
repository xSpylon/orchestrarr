import type { ActivityItem, Stream } from '@/types/dashboard.types';
import type { TautulliHistoryEntry } from '@/types/title.types';

export type TitleRecentActivityProps = {
  /** Fallback name for a Tautulli play without its own title. */
  title: string;
  activity: ActivityItem[];
  playback: TautulliHistoryEntry[];
  activeStreams: Stream[];
};
