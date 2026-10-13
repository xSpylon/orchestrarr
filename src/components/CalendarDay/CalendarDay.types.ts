import type { CalendarEntry } from '@/types/dashboard.types';

export type CalendarDayProps = {
  date: Date;
  /** The entries on this date. */
  entries: CalendarEntry[];
  outside: boolean;
  today: boolean;
  onOpen: (entry: CalendarEntry) => void;
};
