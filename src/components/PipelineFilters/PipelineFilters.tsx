import { pipelineStateLabel } from '@/helpers/format';
import { SearchField } from '@/components/SearchField/SearchField';
import { FilterMenu } from '@/components/FilterMenu/FilterMenu';
import { Button } from '@/components/Button/Button';
import { Toolbar, ToolbarSpacer } from '@/components/Toolbar/Toolbar';
import type { PipelineSort } from '@/hooks/use_pipeline_filters';
import type { PipelineFiltersProps } from './PipelineFilters.types';
import { useLocale } from '@/lib/i18n';

export function PipelineFilters({ filters }: PipelineFiltersProps) {
  const { t } = useLocale();
  const sortOptions = [{ value: 'updated', label: t('pipeline.recentlyUpdated') }, { value: 'title', label: t('requests.titleAZ') }, { value: 'service', label: t('pipeline.serviceAZ') }];
  return <Toolbar>
    <SearchField label={t('pipeline.search')} placeholder={t('pipeline.filterPlaceholder')} value={filters.query} onChange={filters.setQuery} />
    <FilterMenu label={t('common.service')} value={filters.service} options={[{ value: 'all', label: t('activity.allServices') }, ...filters.services.map((value) => ({ value, label: value }))]} onChange={filters.setService} />
    <FilterMenu label={t('pipeline.state')} value={filters.state} options={[{ value: 'all', label: t('pipeline.allStates') }, ...filters.states.map((value) => ({ value, label: pipelineStateLabel(value) || value }))]} onChange={filters.setState} />
    {filters.isFiltered ? <Button variant="link" className="pipeline-clear" onClick={filters.clear}>{t('common.clear')}</Button> : null}
    <ToolbarSpacer />
    <FilterMenu label={t('requests.sort')} clearable={false} value={filters.sort} options={sortOptions} onChange={(value) => filters.setSort(value as PipelineSort)} />
  </Toolbar>;
}
