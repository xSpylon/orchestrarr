import type { ReactNode } from 'react';

export type ViewTab = { value: string; label: string; count?: number };
export type ViewTabsProps = {
  /** Prefix for the tab and panel ids, unique per page. */
  id: string;
  label: string;
  tabs: ViewTab[];
  value: string;
  onChange: (value: string) => void;
  /** Content of the tab panel the tabs control. */
  children: ReactNode;
};
