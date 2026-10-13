import type { KeyboardEvent } from 'react';

/** Move between primary row actions without hijacking inputs or secondary controls. */
export function navigateRows(event: KeyboardEvent<HTMLElement>, selector: string) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
  const rows = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(selector));
  const current = rows.indexOf(event.target as HTMLButtonElement);
  if (current < 0 || !rows.length) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)));
  rows[next].focus();
}
