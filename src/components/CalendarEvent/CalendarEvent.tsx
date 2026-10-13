import type { CalendarEventProps } from './CalendarEvent.types';
import { useLocale } from '@/lib/i18n';

export function CalendarEvent({ entry, onOpen }: CalendarEventProps) {
  const { t } = useLocale();
  return <button className="calendar-event" title={t('calendar.eventTitle', undefined, { title: entry.title, detail: entry.detail || '', service: entry.service || '' })} aria-label={t('calendar.eventLabel', undefined, { title: entry.title, detail: entry.detail || '', service: entry.service || '' })} onClick={() => onOpen(entry)}><strong>{entry.title}</strong><small>{entry.detail} · {entry.service}</small></button>;
}
