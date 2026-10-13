import type { CalendarEntry } from '@/types/dashboard.types';

export type CalendarMonthProps = {
  year: number;
  monthIndex: number;
  label: string;
  entries: CalendarEntry[];
  loading: boolean;
  error: string;
  onOpen: (entry: CalendarEntry) => void;
};
