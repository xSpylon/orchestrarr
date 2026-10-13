import type { DashboardItem } from '@/types/dashboard.types';

export type DataTableProps = {
  items: DashboardItem[];
  empty: string;
  onSelect: (item: DashboardItem) => void;
  onAction?: (action: string, item: DashboardItem) => void;
};

export type DataTableGroupProps = DataTableProps & {
  /** Group rows by status shape with collapsible headers. */
  grouped?: boolean;
};
