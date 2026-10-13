import type { ReactNode } from 'react';
import type { IconName } from '@/components/ui/Icon';

export type OverviewStatProps = {
  icon: IconName;
  label: string;
  value: ReactNode;
  note: ReactNode;
  noteClassName?: string;
  onClick: () => void;
};
