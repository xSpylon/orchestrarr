import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { CalendarDay } from '@/components/CalendarDay/CalendarDay';
import { dateKey, monthCells } from '@/helpers/calendar';
import type { CalendarMonthProps } from './CalendarMonth.types';
import { useLocale } from '@/lib/i18n';

export function CalendarMonth({ year, monthIndex, label, entries, loading, error, onOpen }: CalendarMonthProps) {
  const { locale, t } = useLocale();
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(Date.UTC(2024, 0, 1 + index))));
  const cells = useMemo(() => monthCells(year, monthIndex), [monthIndex, year]);
  const today = dateKey(new Date());
  return <div className="calendar-grid-wrap">{error ? <EmptyState role="alert">{error}</EmptyState> : <>
    {loading && !entries.length ? <p className="calendar-empty" role="status">{t('calendar.loadingReleases', undefined, { value: label })}</p> : null}
    {!loading && !entries.length ? <p className="calendar-empty" role="status">{t('calendar.noReleases', undefined, { value: label })}</p> : null}
    <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-days">{cells.map((date, index) => {
      const key = dateKey(date);
      return <CalendarDay key={`${key}-${index}`} date={date} entries={entries.filter((entry) => String(entry.date || '').slice(0, 10) === key)} outside={date.getMonth() !== monthIndex} today={key === today} onOpen={onOpen} />;
    })}</div>
  </>}</div>;
}
