import type { DashboardItem } from '@/types/dashboard.types';

export type OverviewRecentlyAddedProps = {
  media?: DashboardItem[];
  onNavigate: (view: string) => void;
  onSelect: (item: DashboardItem) => void;
};
