import type { DashboardItem } from '@/types/dashboard.types';

export type ItemDetailsProps = {
  item: DashboardItem;
  technicalDetails: boolean;
  onAction: (action: string, item: DashboardItem) => void;
  onToast: (message: string) => void;
  onClose: () => void;
};
