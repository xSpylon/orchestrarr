import type { DashboardData, Stream } from '@/types/dashboard.types';

export type PlaybackSummaryProps = {
  streams: Stream[];
  /** Plex is down, so live session counts cannot be trusted. */
  unavailable: boolean;
  summary: NonNullable<NonNullable<DashboardData['analytics']>['summary']>;
};
