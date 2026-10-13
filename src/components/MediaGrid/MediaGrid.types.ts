import type { DashboardItem } from '@/types/dashboard.types';

export type MediaGridItem = DashboardItem & { recentDetail?: string };
export type MediaGridProps = {
  items: MediaGridItem[];
  onSelect: (item: DashboardItem) => void;
  className?: string;
};
