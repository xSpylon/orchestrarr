import type { DashboardData } from '@/types/dashboard.types';

/** Sidebar badges: per page, and per group (shown while a group is collapsed). */
export function navigationCounts(dashboard: DashboardData | null) {
  const unresolvedAlerts = dashboard?.alerts?.filter((item) => !item.resolved).length || 0;
  // Sidebar counts mean "needs you", so Pipeline counts stuck items, not the whole queue (the queue size is on Overview and Pipeline itself).
  const stuckPipeline = dashboard?.pipeline?.filter((item) => item.needsAction).length || 0;
  const counts: Record<string, number | undefined> = {
    requests: dashboard?.requests?.filter((item) => ['Pending', 'Requested'].includes(item.state || '')).length,
    pipeline: stuckPipeline,
    activity: unresolvedAlerts,
    streams: dashboard?.streams?.length,
  };
  const groupCounts: Record<string, number> = {
    Acquisition: (counts.requests || 0) + stuckPipeline,
    Observe: unresolvedAlerts,
  };
  return { counts, groupCounts, unresolvedAlerts };
}
