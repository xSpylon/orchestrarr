import type { ReactNode } from 'react';

export type EmptyStateProps = {
  title?: ReactNode;
  children?: ReactNode;
  /** Left-aligned and tight, for empty sections inside a page rather than a whole empty page. */
  compact?: boolean;
  role?: 'status' | 'alert';
};
