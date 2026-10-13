import { useMemo } from 'react';
import { matchTitleRecords } from '@/helpers/title_status';
import type { DashboardData } from '@/types/dashboard.types';
import type { MediaType } from '@/types/title.types';

export function useTitleRecords(dashboard: DashboardData, resolvedTmdbId: string, mediaType: MediaType) {
  const { requests, pipeline, activity } = dashboard;
  return useMemo(() => matchTitleRecords({ requests, pipeline, activity }, resolvedTmdbId, mediaType), [requests, pipeline, activity, resolvedTmdbId, mediaType]);
}
