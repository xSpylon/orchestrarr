import { useMemo } from 'react';
import { CalendarAgendaDay } from '@/components/CalendarAgendaDay/CalendarAgendaDay';
import { agendaDays } from '@/helpers/calendar';
import type { CalendarAgendaProps } from './CalendarAgenda.types';
import { useLocale } from '@/lib/i18n';

export function CalendarAgenda({ label, entries, onOpen }: CalendarAgendaProps) {
  const { t } = useLocale();
  const days = useMemo(() => agendaDays(entries), [entries]);
  return <div className="calendar-agenda" aria-label={t('calendar.agendaLabel', undefined, { value: label })}>{days.map(([day, dayEntries]) => <CalendarAgendaDay key={day} day={day} entries={dayEntries} onOpen={onOpen} />)}</div>;
}
