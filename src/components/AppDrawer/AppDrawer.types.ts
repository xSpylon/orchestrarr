import type { DashboardItem } from '@/types/dashboard.types';

export type AppDrawerProps = {
  item: DashboardItem | null;
  editingService: string | null;
  toastMessage: string;
  technicalDetails: boolean;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string) => void;
  onTest: (name: string, settings: Record<string, string>) => Promise<void>;
  onAction: (action: string, item: DashboardItem) => void;
};
