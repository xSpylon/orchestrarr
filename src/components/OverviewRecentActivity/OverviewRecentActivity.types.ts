import type { ActivityItem } from '@/types/dashboard.types';

export type OverviewRecentActivityProps = {
  events: ActivityItem[];
  onNavigate: (view: string) => void;
};
