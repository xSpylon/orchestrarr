import type { ReactNode } from 'react';

export type ListRowProps = {
  title: ReactNode;
  detail?: ReactNode;
  /** Right-aligned, muted: service, time, mode. */
  meta?: ReactNode;
  /** Dot colour: live (green), attention, failed; muted when left out. */
  tone?: 'live' | 'attention' | 'failed';
  /** Makes the whole row a button. */
  onClick?: () => void;
};
