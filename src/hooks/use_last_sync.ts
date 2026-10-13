import type { DashboardData } from '@/types/dashboard.types';

/** The "last sync" label in the top bar: the time of the last good refresh, or why there isn't one. */
export function useLastSync(dashboard: DashboardData | null, error: string | null) {
  if (dashboard?.generatedAt) return new Date(dashboard.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (error) return dashboard ? 'Update failed' : 'Unavailable';
  return '';
}
