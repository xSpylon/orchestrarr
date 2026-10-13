import type { DashboardData } from '@/types/dashboard.types';
import type { useAppShellSidebar } from '@/hooks/use_app_shell_sidebar';

export type AppShellNavigationProps = {
  view: string;
  dashboard: DashboardData | null;
  sidebar: ReturnType<typeof useAppShellSidebar>;
  counts: Record<string, number | undefined>;
  groupCounts: Record<string, number>;
  onNavigate: (view: string) => void;
  onSearch: () => void;
};
