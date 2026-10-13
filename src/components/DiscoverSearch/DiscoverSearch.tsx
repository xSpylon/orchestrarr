import { SearchField } from '@/components/SearchField/SearchField';
import type { DiscoverSearchProps } from './DiscoverSearch.types';
import { useLocale } from '@/lib/i18n';

export function DiscoverSearch({ query, onChange, onSubmit }: DiscoverSearchProps) {
  const { t } = useLocale();
  return <form className="discovery-search" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    {/* Results follow typing; Enter submits the form to search straight away, so no button is needed. */}
    <SearchField label={t('discovery.searchLabel')} placeholder={t('discovery.searchPlaceholder')} value={query} onChange={onChange} />
  </form>;
}
