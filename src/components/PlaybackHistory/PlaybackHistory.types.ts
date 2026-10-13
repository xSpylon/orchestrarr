import type { DashboardData } from '@/types/dashboard.types';

export type PlaybackHistoryEntry = NonNullable<NonNullable<DashboardData['analytics']>['history']>[number];
export type PlaybackHistoryProps = { history: PlaybackHistoryEntry[] };
