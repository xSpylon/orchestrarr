import type { ReactNode } from 'react';

export type PageHeadingProps = {
  eyebrow?: string;
  /** Empty while the name is still loading; a placeholder bar shows instead. */
  title: string;
  copy?: string;
  actions?: ReactNode;
};
