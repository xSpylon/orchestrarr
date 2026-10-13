import type { DashboardItem } from '@/types/dashboard.types';

export type OverviewIssueProps = {
  item: DashboardItem;
  onSelect: (item: DashboardItem) => void;
};
