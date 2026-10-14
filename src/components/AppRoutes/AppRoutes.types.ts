import type { AppRoute } from '@/helpers/app_route';
import type { AppNavigate } from '@/hooks/use_app_location';
import type { ThemePreference } from '@/hooks/use_theme_preference';
import type { OpenTitle } from '@/hooks/use_title_navigation';
import type { MediaFocus } from '@/lib/navigation';
import type { ActivityItem, DashboardData, DashboardItem, DiscoveryItem, Service } from '@/types/dashboard.types';

export type AppPreferences = {
  autoRefresh: boolean;
  technicalDetails: boolean;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onAutoRefresh: (enabled: boolean) => void;
  onTechnicalDetails: (enabled: boolean) => void;
};

export type AppRoutesProps = {
  route: AppRoute;
  /** pathname + search; list pages remount when it changes so their filters follow the URL. */
  locationKey: string;
  dashboard: DashboardData;
  title: { item: DiscoveryItem | null; focus?: MediaFocus; onEpisodeSelect: (focus?: MediaFocus) => void };
  preferences: AppPreferences;
  onNavigate: AppNavigate;
  onSelect: (item: DashboardItem | ActivityItem | Service) => void;
  onOpenTitle: OpenTitle;
  onAction: (action: string, item: DashboardItem) => void;
  onEditService: (key: string) => void;
  onToast: (message: string, persist?: boolean) => void;
  onRefresh: () => Promise<void>;
};
