export type AppShellNavLinkProps = {
  navKey: string;
  label: string;
  active: boolean;
  count?: number;
  /** Shown as a tooltip when the sidebar is collapsed to icons. */
  showTitle: boolean;
  onNavigate: (key: string) => void;
};
