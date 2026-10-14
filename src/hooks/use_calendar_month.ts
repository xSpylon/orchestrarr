import { useEffect, useState } from 'react';
import type { CalendarEntry } from '@/types/dashboard.types';
import { apiRequest } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { dateKey } from '@/helpers/calendar';

type CalendarPayload = { entries?: CalendarEntry[] };

/** The shown month (from and to ?month=YYYY-MM) and its releases. */
export function useCalendarMonth(refreshKey = '') {
  const { t } = useLocale();
  const [month, setMonth] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('month');
    const date = value && /^\d{4}-\d{2}$/.test(value) ? new Date(`${value}-01T00:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const from = dateKey(new Date(year, monthIndex, 1)); const to = dateKey(new Date(year, monthIndex + 1, 0));

  useEffect(() => { let active = true; setError(''); setLoading(true); setEntries([]); apiRequest<CalendarPayload>(`/api/calendar?from=${from}&to=${to}`).then((data) => { if (active) setEntries(data.entries || []); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : t('calendar.unavailable')); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [from, to, refreshKey, t]);
  useEffect(() => {
    const monthParam = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    window.history.replaceState({ ...(window.history.state || {}), view: 'calendar' }, '', `/calendar?month=${monthParam}`);
  }, [monthIndex, year]);

  return {
    month, year, monthIndex, entries, error, loading,
    exportUrl: `/api/calendar.ics?from=${from}&to=${to}`,
    showPrevious: () => setMonth(new Date(year, monthIndex - 1, 1)),
    showNext: () => setMonth(new Date(year, monthIndex + 1, 1)),
  };
}
