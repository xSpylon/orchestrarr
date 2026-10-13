import { StatusIcon } from '@/components/StatusIcon/StatusIcon';
import styles from './StatusBadge.module.scss';
import type { StatusBadgeProps } from './StatusBadge.types';
import { useLocale, translateStatus } from '@/lib/i18n';

export function StatusBadge({ value, progress, shape, className = 'status-badge' }: StatusBadgeProps) {
  const { t } = useLocale();
  return <span className={`${className} ${styles.badge}`}><StatusIcon state={value} progress={progress} shape={shape} />{translateStatus(t, value)}</span>;
}
