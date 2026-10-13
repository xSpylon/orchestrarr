import type { ButtonStyle } from './Button.types';

const variantClass = { solid: 'solid-button', quiet: 'quiet-button', ghost: 'ghost-button', icon: 'icon-button', link: 'link-button' };

/** Class list for a button, also used for links that look like buttons. */
export function buttonClass({ variant = 'quiet', size, danger, className }: ButtonStyle = {}): string {
  return [variantClass[variant], size === 'small' && 'button-small', danger && 'danger-button', className].filter(Boolean).join(' ');
}
