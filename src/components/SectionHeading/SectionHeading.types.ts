import type { ReactNode } from 'react';

export type SectionHeadingProps = {
  title: ReactNode;
  /** Shown as a muted number after the title. */
  count?: number;
  description?: ReactNode;
  /** Controls on the right, such as a link to the full list. */
  actions?: ReactNode;
  /** "operator" is the lighter heading used on the Overview panels. */
  variant?: 'section' | 'operator';
};
