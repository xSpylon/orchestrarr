import type { CalendarEntry } from '@/types/dashboard.types';

export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Six Monday-first weeks covering the month, padded with days from the neighbouring months. */
export function monthCells(year: number, monthIndex: number): Date[] {
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(year, monthIndex, index - offset + 1));
}

export function agendaDays(entries: CalendarEntry[]): Array<[string, CalendarEntry[]]> {
  const grouped = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = String(entry.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    grouped.set(key, [...(grouped.get(key) || []), entry]);
  }
  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
}
