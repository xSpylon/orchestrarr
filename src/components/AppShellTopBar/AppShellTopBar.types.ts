export type AppShellTopBarProps = {
  view: string;
  activeGroup?: string;
  pageContext?: string;
  lastSync: string;
  mobile: boolean;
  collapsed: boolean;
  menuOpen: boolean;
  unresolvedAlerts: number;
  theme: 'dark' | 'light';
  onSidebarToggle: () => void;
  onSearch: () => void;
  onRefresh: () => void;
  onThemeToggle: () => void;
  onAlerts: () => void;
};
