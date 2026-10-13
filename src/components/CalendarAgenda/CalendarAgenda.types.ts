import type { CalendarEntry } from '@/types/dashboard.types';

export type CalendarAgendaProps = { label: string; entries: CalendarEntry[]; onOpen: (entry: CalendarEntry) => void };
