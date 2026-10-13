import { SearchField } from '@/components/SearchField/SearchField';
import { FilterMenu } from '@/components/FilterMenu/FilterMenu';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import type { ActivityFiltersProps } from './ActivityFilters.types';
import { useLocale } from '@/lib/i18n';

export function ActivityFilters({ filters }: ActivityFiltersProps) {
  const { t } = useLocale();
  const severityOptions = [{ value: 'all', label: t('activity.allSeverity') }, { value: 'attention', label: t('status.attention') }, { value: 'failed', label: t('activity.failed') }, { value: 'info', label: t('activity.info') }];
  const timeOptions = [{ value: 'all', label: t('activity.anyTime') }, { value: '24h', label: t('activity.last24Hours') }, { value: '7d', label: t('activity.last7Days') }];
  return <Toolbar>
    <SearchField label={t('activity.filterMedia')} placeholder={t('activity.filterPlaceholder')} value={filters.mediaQuery} onChange={filters.setMediaQuery} />
    <FilterMenu label={t('common.service')} value={filters.service} options={[{ value: 'all', label: t('activity.allServices') }, ...filters.services.map((name) => ({ value: name, label: name }))]} onChange={filters.setService} />
    <FilterMenu label={t('activity.severity')} value={filters.severity} options={severityOptions} onChange={filters.setSeverity} />
    <FilterMenu label={t('activity.event')} value={filters.type} options={[{ value: 'all', label: t('activity.allEventTypes') }, ...filters.types.map((name) => ({ value: name, label: name.replaceAll('_', ' ') }))]} onChange={filters.setType} />
    <FilterMenu label={t('activity.time')} value={filters.time} options={timeOptions} onChange={filters.setTime} />
  </Toolbar>;
}
