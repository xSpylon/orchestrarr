import { Icon } from '@/components/ui/Icon';
import type { SearchFieldProps } from './SearchField.types';

export function SearchField({ label, value, onChange, placeholder, className }: SearchFieldProps) {
  return <label className={`request-search${className ? ` ${className}` : ''}`}>
    <Icon name="search" />
    <span className="sr-only">{label}</span>
    <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" />
  </label>;
}
