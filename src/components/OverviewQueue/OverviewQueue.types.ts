import type { DashboardItem } from '@/types/dashboard.types';

export type OverviewQueueProps = {
  items: DashboardItem[];
  onNavigate: (view: string) => void;
  onSelect: (item: DashboardItem) => void;
};
