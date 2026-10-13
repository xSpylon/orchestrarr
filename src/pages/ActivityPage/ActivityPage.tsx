import type { DashboardData, ActivityItem } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { ViewTabs } from '@/components/ViewTabs/ViewTabs';
import { Button } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ResultsCount } from '@/components/ResultsCount/ResultsCount';
import { ActivityFilters } from '@/components/ActivityFilters/ActivityFilters';
import { ActivityDayGroup } from '@/components/ActivityDayGroup/ActivityDayGroup';
import { useActivityFilters } from '@/hooks/use_activity_filters';
import { useLocale } from '@/lib/i18n';

type ActivityPageProps = { dashboard: DashboardData; onSelect: (item: ActivityItem) => void };

export function ActivityPage({ dashboard, onSelect }: ActivityPageProps) {
  const { t } = useLocale();
  const filters = useActivityFilters(dashboard);
  const { visible, filtered } = filters;
  const truncated = visible.length < filtered.length;
  return <>
    <PageHeading eyebrow={t('activity.eyebrow')} title={t('activity.title')} />
    <ViewTabs id="activity" label={t('activity.view')} tabs={[{ value: 'alerts', label: t('activity.alerts'), count: filters.alertCount }, { value: 'all', label: t('activity.allEvents'), count: filters.eventCount }]} value={filters.filter} onChange={filters.setFilter}>
      <ActivityFilters filters={filters} />
      <ResultsCount>{truncated ? t('activity.showing', undefined, { visible: visible.length, total: filtered.length }) : t('activity.events', undefined, { value: filtered.length })}</ResultsCount>
      <div className="activity-list">{visible.length ? filters.days.map(([day, rows]) => <ActivityDayGroup key={day} day={day} rows={rows} onSelect={onSelect} />) : <EmptyState>{t('activity.empty')}</EmptyState>}</div>
      {truncated ? <Button className="activity-load-more" onClick={filters.showMore}>{t('activity.showMore')}</Button> : null}
    </ViewTabs>
    <PageFooter dashboard={dashboard} />
  </>;
}
