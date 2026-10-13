import type { ReactNode } from 'react';
import type { DashboardData } from '@/types/dashboard.types';

export type AppShellProps = {
  view: string;
  pageContext?: string;
  dashboard: DashboardData | null;
  lastSync: string;
  children: ReactNode;
  onNavigate: (view: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onAlerts: () => void;
  onDemoProfileChange?: (profile: string) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
};
