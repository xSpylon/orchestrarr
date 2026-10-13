import type { CalendarAgendaDayProps } from './CalendarAgendaDay.types';
import { useLocale } from '@/lib/i18n';

export function CalendarAgendaDay({ day, entries, onOpen }: CalendarAgendaDayProps) {
  const { locale, t } = useLocale();
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' });
  return <section className="calendar-agenda-day">
    <h3><time dateTime={day}>{dayFormat.format(new Date(`${day}T12:00:00`))}</time></h3>
    <ul>{entries.map((entry, index) => <li key={`${entry.sourceId || entry.title}-${index}`}><button className="calendar-agenda-event" onClick={() => onOpen(entry)}><strong>{entry.title}</strong><span>{entry.type || t('calendar.release')} · {entry.detail || t('calendar.dateUnavailable')}</span><small>{entry.service || t('overview.sourceUnavailable')}</small></button></li>)}</ul>
  </section>;
}
