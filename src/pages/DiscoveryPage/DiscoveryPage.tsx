import type { DashboardData, DiscoveryItem } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { Button } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ResultsCount } from '@/components/ResultsCount/ResultsCount';
import { DiscoverSearch } from '@/components/DiscoverSearch/DiscoverSearch';
import { DiscoverError } from '@/components/DiscoverError/DiscoverError';
import { DiscoverSkeleton } from '@/components/DiscoverSkeleton/DiscoverSkeleton';
import { DiscoverGrid } from '@/components/DiscoverGrid/DiscoverGrid';
import { useDiscoverResults } from '@/hooks/use_discover_results';
import { useLocale } from '@/lib/i18n';

type DiscoveryPageProps = { dashboard: DashboardData; onOpen: (item: DiscoveryItem) => void };

export function DiscoveryPage({ dashboard, onOpen }: DiscoveryPageProps) {
  const { t } = useLocale();
  const refreshKey = dashboard.mode === 'demo' ? dashboard.demoProfile || 'medium' : dashboard.mode || 'live';
  const { query, results, visible, loading, error, hasMore, loadMore, loadMoreSentinel, measureGrid, retry, searchNow, setQuery } = useDiscoverResults(refreshKey);
  const term = query.trim();

  return <>
    <PageHeading title={t('nav.discovery')} />
    <DiscoverSearch query={query} onChange={setQuery} onSubmit={searchNow} />
    {error ? <DiscoverError message={error} onRetry={retry} /> : null}
    {!results.length && loading ? <DiscoverSkeleton /> : null}
    {!results.length && !loading && !error ? <EmptyState>{t('discovery.empty')}</EmptyState> : null}
    {results.length ? <>
      <ResultsCount>{term ? t('discovery.resultsFor', undefined, { value: term }) : t('discovery.trending')} · {t('discovery.shown', undefined, { value: visible.length })}</ResultsCount>
      <DiscoverGrid ref={measureGrid} items={visible} onOpen={onOpen} />
      {loading ? <p className="load-more-status" role="status">{t('discovery.loadingMore')}</p> : null}
      {!loading && !error && hasMore ? <Button ref={loadMoreSentinel} className="discovery-more" onClick={loadMore}>{t('discovery.showMore')}</Button> : null}
    </> : null}
    <PageFooter dashboard={dashboard} />
  </>;
}
