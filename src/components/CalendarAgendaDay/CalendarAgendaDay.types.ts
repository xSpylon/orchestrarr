import type { CalendarEntry } from '@/types/dashboard.types';

export type CalendarAgendaDayProps = {
  /** YYYY-MM-DD */
  day: string;
  entries: CalendarEntry[];
  onOpen: (entry: CalendarEntry) => void;
};
