import type { DashboardData, DashboardItem } from '@/types/dashboard.types';
export type CommandPaletteProps = {
  open: boolean;
  dashboard: DashboardData | null;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onSelect: (item: DashboardItem) => void;
  onThemeToggle: () => void;
  onRefresh: () => void;
  theme: 'dark' | 'light';
};
