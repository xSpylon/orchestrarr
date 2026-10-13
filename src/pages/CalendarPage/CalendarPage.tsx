import type { DashboardData, CalendarEntry } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { buttonClass } from '@/components/Button/button_class';
import { CalendarToolbar } from '@/components/CalendarToolbar/CalendarToolbar';
import { CalendarMonth } from '@/components/CalendarMonth/CalendarMonth';
import { CalendarAgenda } from '@/components/CalendarAgenda/CalendarAgenda';
import { useCalendarMonth } from '@/hooks/use_calendar_month';
import { useLocale } from '@/lib/i18n';

type CalendarPageProps = { dashboard: DashboardData; onOpen: (entry: CalendarEntry) => void };
export function CalendarPage({ dashboard, onOpen }: CalendarPageProps) {
  const { locale, t } = useLocale();
  const calendar = useCalendarMonth(dashboard.demoProfile || dashboard.mode || 'live');
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendar.month);

  return <>
    <PageHeading eyebrow={t('calendar.eyebrow')} title={t('calendar.title')} actions={<a className={buttonClass()} href={calendar.exportUrl}>{t('calendar.export')}</a>} />
    <section className="calendar-shell">
      <CalendarToolbar label={monthLabel} onPrevious={calendar.showPrevious} onNext={calendar.showNext} />
      <CalendarMonth year={calendar.year} monthIndex={calendar.monthIndex} label={monthLabel} entries={calendar.entries} loading={calendar.loading} error={calendar.error} onOpen={onOpen} />
      <CalendarAgenda label={monthLabel} entries={calendar.entries} onOpen={onOpen} />
    </section>
    <PageFooter dashboard={dashboard} />
  </>;
}
