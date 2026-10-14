import type { DashboardItem } from '@/types/dashboard.types';

export type MediaGridItem = DashboardItem & { recentEpisode?: string; recentlyAdded?: boolean };
export type MediaGridProps = {
  items: MediaGridItem[];
  onSelect: (item: DashboardItem) => void;
  className?: string;
};
