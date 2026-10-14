import type { DashboardData, DashboardItem } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { MediaGrid } from '@/components/MediaGrid/MediaGrid';
import { ViewTabs } from '@/components/ViewTabs/ViewTabs';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ResultsCount } from '@/components/ResultsCount/ResultsCount';
import { Pagination } from '@/components/Pagination/Pagination';
import { LibrarySection } from '@/components/LibrarySection/LibrarySection';
import { LibraryControls } from '@/components/LibraryControls/LibraryControls';
import { useLibraryFilters } from '@/hooks/use_library_filters';
import type { LibraryKind } from '@/helpers/library';
import { useLocale } from '@/lib/i18n';

type MediaPageProps = { dashboard: DashboardData; onSelect: (item: DashboardItem) => void };

export function MediaPage({ dashboard, onSelect }: MediaPageProps) {
  const { t } = useLocale();
  const library = useLibraryFilters(dashboard);
  const { query, filteredItems, pageItems, recentCards, currentPage, pageSize, episodeCount } = library;
  const noun = library.selectedType === 'movie' ? t('media.moviesNoun') : t('media.showsNoun');
  const copy = library.hasFullLibrary
    ? t('media.libraryCopy', undefined, { count: library.selectedItems.length.toLocaleString(), noun })
    : t('media.unavailableCopy', undefined, { noun });

  return <>
    <PageHeading eyebrow={t('media.eyebrow')} title={t('nav.media')} copy={copy} />
    <ViewTabs id="media" label={t('media.type')} tabs={[{ value: 'movie', label: t('media.moviePlural') }, { value: 'show', label: t('media.showPlural') }]} value={library.selectedType} onChange={(value) => library.setType(value as LibraryKind)}>
    <LibrarySection title={t('media.recentTitle', undefined, { noun })} description={t('media.recentDescription', undefined, { count: recentCards.length.toLocaleString(), titleWord: recentCards.length === 1 ? t('media.title') : t('media.titles') })}>
      {recentCards.length ? <MediaGrid items={recentCards.slice(0, 12)} onSelect={onSelect} className="media-recent-grid" /> : <EmptyState>{t('media.recentEmpty', undefined, { noun })}</EmptyState>}
    </LibrarySection>

    <LibrarySection title={t('media.allTitle', undefined, { noun })} description={`${filteredItems.length.toLocaleString()} ${noun}${episodeCount ? ` · ${episodeCount.toLocaleString()} ${t('media.episodes')}` : ''}`}>
      <LibraryControls noun={noun} query={query} onQueryChange={library.setQuery} sort={library.sort} onSortChange={library.setSort} />
      <ResultsCount>{filteredItems.length ? t('media.showing', undefined, { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, filteredItems.length), total: filteredItems.length.toLocaleString() }) : t('media.zeroTitles')}</ResultsCount>
      {pageItems.length ? <MediaGrid items={pageItems} onSelect={onSelect} /> : <EmptyState>{library.selectedItems.length ? t('media.noMatch', undefined, { noun, query }) : t('media.noReturned', undefined, { noun })}</EmptyState>}
      <Pagination page={currentPage} pageCount={library.pageCount} onChange={library.setPage} label={t('media.pages')} />
    </LibrarySection>
    </ViewTabs>
    <PageFooter dashboard={dashboard} />
  </>;
}
