import { CalendarEvent } from '@/components/CalendarEvent/CalendarEvent';
import type { CalendarDayProps } from './CalendarDay.types';
import { useLocale } from '@/lib/i18n';

export function CalendarDay({ date, entries, outside, today, onOpen }: CalendarDayProps) {
  const { t } = useLocale();
  return <div className={`calendar-day ${outside ? 'outside' : ''} ${entries.length ? 'has-events' : ''} ${today ? 'today' : ''}`}>
    <span className="calendar-day-number">{date.getDate()}</span>
    {entries.slice(0, 3).map((entry, index) => <CalendarEvent key={`${entry.sourceId || entry.title}-${index}`} entry={entry} onOpen={onOpen} />)}
    {entries.length > 3 ? <details className="calendar-more"><summary>{t('calendar.more', undefined, { value: entries.length - 3 })}</summary><div>{entries.slice(3).map((entry, index) => <button key={`${entry.sourceId || entry.title}-extra-${index}`} onClick={() => onOpen(entry)}>{entry.title}<small>{entry.detail} · {entry.service}</small></button>)}</div></details> : null}
  </div>;
}
