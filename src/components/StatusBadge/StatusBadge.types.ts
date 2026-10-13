import type { StatusShape } from '@/helpers/format';

export type StatusBadgeProps = {
  value?: string;
  /** 0–100; fills the in-progress icon. */
  progress?: number;
  /** Overrides the icon shape read from `value`. */
  shape?: StatusShape;
  className?: string;
};
