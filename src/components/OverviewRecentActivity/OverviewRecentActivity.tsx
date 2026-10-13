import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { Button } from '@/components/Button/Button';
import { OverviewActivityEvent } from '@/components/OverviewActivityEvent/OverviewActivityEvent';
import type { OverviewRecentActivityProps } from './OverviewRecentActivity.types';
import { useLocale } from '@/lib/i18n';

export function OverviewRecentActivity({ events, onNavigate }: OverviewRecentActivityProps) {
  const { t } = useLocale();
  const recent = events.slice(0, 5);
  if (!recent.length) return null;
  return <section className="overview-section operator-activity">
    <SectionHeading variant="operator" title={t('overview.recentActivity')} actions={<Button variant="link" onClick={() => onNavigate('activity')}>{t('overview.activityLog')}</Button>} />
    <ul>{recent.map((event, index) => <OverviewActivityEvent key={`${event.title}-${event.at || index}`} event={event} />)}</ul>
  </section>;
}
