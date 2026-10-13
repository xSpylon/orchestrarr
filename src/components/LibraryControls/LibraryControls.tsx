import { SearchField } from '@/components/SearchField/SearchField';
import { FilterMenu } from '@/components/FilterMenu/FilterMenu';
import { Toolbar, ToolbarSpacer } from '@/components/Toolbar/Toolbar';
import type { LibrarySort } from '@/hooks/use_library_filters';
import type { LibraryControlsProps } from './LibraryControls.types';
import { useLocale } from '@/lib/i18n';

export function LibraryControls({ noun, query, onQueryChange, sort, onSortChange }: LibraryControlsProps) {
  const { t } = useLocale();
  const sortOptions = [{ value: 'recent', label: t('library.libraryOrder') }, { value: 'added', label: t('library.newestAdded') }, { value: 'title', label: t('requests.titleAZ') }, { value: 'year', label: t('library.newestYear') }];
  return <Toolbar>
    <SearchField label={t('library.search', undefined, { noun })} placeholder={t('library.filter', undefined, { noun })} value={query} onChange={onQueryChange} />
    <ToolbarSpacer />
    <FilterMenu label={t('requests.sort')} clearable={false} value={sort} options={sortOptions} onChange={(value) => onSortChange(value as LibrarySort)} />
  </Toolbar>;
}
