import { SearchField } from '@/components/SearchField/SearchField';
import { FilterMenu } from '@/components/FilterMenu/FilterMenu';
import { Toolbar, ToolbarSpacer } from '@/components/Toolbar/Toolbar';
import type { RequestsSort } from '@/hooks/use_requests_filters';
import type { RequestsFiltersProps } from './RequestsFilters.types';
import { useLocale } from '@/lib/i18n';

export function RequestsFilters({ filters }: RequestsFiltersProps) {
  const { t } = useLocale();
  const typeOptions = [{ value: 'all', label: t('requests.allMedia') }, { value: 'movie', label: t('media.moviePlural') }, { value: 'series', label: t('media.showPlural') }];
  const sortOptions = [{ value: 'recent', label: t('requests.mostRecent') }, { value: 'title', label: t('requests.titleAZ') }, { value: 'requester', label: t('requests.requesterAZ') }, { value: 'state', label: t('requests.statusAZ') }];
  return <Toolbar>
    <SearchField label={t('requests.search')} placeholder={t('requests.filterPlaceholder')} value={filters.query} onChange={filters.setQuery} />
    <FilterMenu label={t('requests.type')} value={filters.type} options={typeOptions} onChange={filters.setType} />
    <FilterMenu label={t('requests.requester')} value={filters.requester} options={[{ value: 'all', label: t('requests.anyone') }, ...filters.requesters.map((name) => ({ value: name, label: name }))]} onChange={filters.setRequester} />
    <ToolbarSpacer />
    <FilterMenu label={t('requests.sort')} clearable={false} value={filters.sort} options={sortOptions} onChange={(value) => filters.setSort(value as RequestsSort)} />
  </Toolbar>;
}
