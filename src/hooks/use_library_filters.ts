import { useEffect, useMemo, useState } from 'react';
import type { DashboardData } from '@/types/dashboard.types';
import { displayText } from '@/helpers/format';
import { mediaKind, recentShows, type LibraryItem, type LibraryKind, type RecentShowItem } from '@/helpers/library';

export type LibrarySort = 'recent' | 'added' | 'title' | 'year';
const PAGE_SIZE = 40;

/** Library type, search, sort and page, mirrored into the /media URL. */
export function useLibraryFilters(dashboard: DashboardData) {
  const [initialParams] = useState(() => new URLSearchParams(window.location.search));
  const [selectedType, setSelectedType] = useState<LibraryKind>(initialParams.get('type') === 'show' ? 'show' : 'movie');
  const [query, setQuery] = useState(initialParams.get('search') || '');
  const [sort, setSort] = useState<LibrarySort>(['recent', 'added', 'title', 'year'].includes(initialParams.get('sort') || '') ? initialParams.get('sort') as LibrarySort : 'recent');
  const [page, setPage] = useState(Math.max(1, Number(initialParams.get('page') || 1)));
  const library = (dashboard.allMedia?.length ? dashboard.allMedia : dashboard.media || []) as LibraryItem[];
  const recent = (dashboard.media || []) as LibraryItem[];
  const selectedItems = library.filter((item) => mediaKind(item) === selectedType) as RecentShowItem[];
  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return selectedItems.filter((item) => !term || `${displayText(item.title)} ${item.year || ''} ${item.library || ''}`.toLocaleLowerCase().includes(term)).sort((a, b) => {
      if (sort === 'title') return displayText(a.title).localeCompare(displayText(b.title));
      if (sort === 'year') return Number(b.year || 0) - Number(a.year || 0) || a.title.localeCompare(b.title);
      if (sort === 'added') {
        const addedAt = (value: unknown) => {
          const numeric = Number(value);
          if (value !== '' && Number.isFinite(numeric)) return numeric < 1e12 ? numeric * 1000 : numeric;
          const parsed = Date.parse(String(value || ''));
          return Number.isNaN(parsed) ? 0 : parsed;
        };
        return addedAt(b.addedAt) - addedAt(a.addedAt) || a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [query, selectedItems, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const recentItems = recent.filter((item) => mediaKind(item) === selectedType);
  const recentCards = (selectedType === 'show' ? recentShows(recentItems) : recentItems) as RecentShowItem[];
  const episodeCount = selectedType === 'show' ? filteredItems.reduce((sum, item) => sum + (item.episodeCount || 0), 0) : 0;
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedType !== 'movie') params.set('type', selectedType);
    if (query) params.set('search', query);
    if (sort !== 'recent') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    window.history.replaceState({ ...(window.history.state || {}), view: 'media' }, '', `/media${params.size ? `?${params}` : ''}`);
  }, [page, query, selectedType, sort]);
  return {
    selectedType, query, sort, currentPage, pageCount, pageSize: PAGE_SIZE,
    selectedItems, filteredItems, pageItems, recentCards, episodeCount,
    hasFullLibrary: Boolean(dashboard.allMedia?.length),
    label: selectedType === 'movie' ? 'Movies' : 'Shows',
    setPage,
    // Changing what is listed starts again at page 1.
    setType: (value: LibraryKind) => { setSelectedType(value); setPage(1); },
    setQuery: (value: string) => { setQuery(value); setPage(1); },
    setSort: (value: LibrarySort) => { setSort(value); setPage(1); },
  };
}
