import type { ComponentPropsWithRef } from 'react';

export type ButtonVariant = 'solid' | 'quiet' | 'ghost' | 'icon' | 'link';
export type ButtonStyle = {
  /** solid = primary action, quiet = secondary (default), ghost = low-emphasis, icon = icon-only, link = inline text. */
  variant?: ButtonVariant;
  /** Compact height for dense rows and cards. */
  size?: 'default' | 'small';
  danger?: boolean;
  /** Layout hooks only; visual styling belongs to the variant. */
  className?: string;
};
export type ButtonProps = ButtonStyle & Omit<ComponentPropsWithRef<'button'>, 'className'>;
