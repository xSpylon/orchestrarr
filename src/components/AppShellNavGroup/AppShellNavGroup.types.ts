import type { ReactNode } from 'react';

export type AppShellNavGroupProps = {
  group: string;
  folded: boolean;
  /** Shown on the header while the group is folded. */
  count?: number;
  /** Items stay visible in an icon-only sidebar, where the group header is hidden. */
  hidden: boolean;
  onToggle: () => void;
  children: ReactNode;
};
