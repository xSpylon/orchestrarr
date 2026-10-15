import type { ReactNode } from 'react';

export type ConfirmationOptions = {
  title: string;
  description?: string;
  destructive?: boolean;
};

export type ConfirmationContextValue = { confirm: (options: ConfirmationOptions) => Promise<boolean> };

export type ConfirmationProviderProps = { children: ReactNode };
