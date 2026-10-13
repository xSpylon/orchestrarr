import type { DashboardItem } from '@/types/dashboard.types';

export type RequestListProps = {
  items: DashboardItem[];
  onSelect: (item: DashboardItem) => void;
  onRequestAction?: (item: DashboardItem, action: 'approve' | 'decline') => void;
  emptyMessage?: string;
};
