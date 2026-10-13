import type { EmptyStateProps } from './EmptyState.types';

export function EmptyState({ title, children, compact = false, role }: EmptyStateProps) {
  return <div className={`empty-state${compact ? ' compact' : ''}`} role={role}>{title ? <strong>{title}</strong> : null}{children}</div>;
}
