import type { DashboardData } from '@/types/dashboard.types';

export type OverviewStatsProps = {
  dashboard: DashboardData;
  onNavigate: (view: string) => void;
};
