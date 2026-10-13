import type { CalendarEntry } from '@/types/dashboard.types';

export type CalendarEventProps = { entry: CalendarEntry; onOpen: (entry: CalendarEntry) => void };
