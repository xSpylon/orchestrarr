import type { DashboardItem } from '@/types/dashboard.types';

export type ItemDetailsActionsProps = {
  item: DashboardItem;
  onAction: (action: string, item: DashboardItem) => void;
  onClose: () => void;
};
