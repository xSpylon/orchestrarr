import type { ReactNode } from 'react';

export type DetailDrawerProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};
