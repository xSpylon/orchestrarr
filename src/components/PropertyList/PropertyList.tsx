import type { PropertyListProps, PropertyProps } from './PropertyList.types';

export function PropertyList({ children, className }: PropertyListProps) {
  return <dl className={`detail-list${className ? ` ${className}` : ''}`}>{children}</dl>;
}

export function Property({ label, children, className }: PropertyProps) {
  return <div className={className}><dt>{label}</dt><dd>{children}</dd></div>;
}
