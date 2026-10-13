import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiscoveryItem } from '@/types/dashboard.types';
import { apiRequest } from '@/lib/api';
import { adaptDiscovery, appendUnique, completeRows, type DiscoveryPayload } from '@/helpers/discover';
import { useLocale } from '@/lib/i18n';

/** Debounced TMDb search with paging, full-row trimming and an infinite-scroll sentinel. */
export function useDiscoverResults(refreshKey = '') {
  const { t } = useLocale();
  const [query, setQuery] = useState(new URLSearchParams(location.search).get('q') || '');
  const [results, setResults] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const sequence = useRef(0);
  const searchTimer = useRef<number | null>(null);

  async function load(nextQuery: string, nextPage: number, append = false) {
    const current = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const suffix = new URLSearchParams();
      if (nextQuery.trim()) suffix.set('q', nextQuery.trim());
      if (nextPage > 1) suffix.set('page', String(nextPage));
      const payload = await apiRequest<DiscoveryPayload>(`/api/discovery${suffix.size ? `?${suffix}` : ''}`);
      if (current !== sequence.current) return;
      const items = adaptDiscovery(payload);
      setResults((previous) => append ? appendUnique(previous, items) : items);
      setPage(nextPage);
      setTotalPages(payload.total_pages || nextPage);
    } catch (cause) {
      if (current !== sequence.current) return;
      setError(`${cause instanceof Error ? cause.message : t('discovery.unavailable')}. ${t('discovery.checkTmdb')}`);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }

  const [columns, setColumns] = useState(1);
  const gridObserver = useRef<ResizeObserver | null>(null);
  // The poster grid auto-fills columns, so read how many fit and keep that in step with the window width.
  const measureGrid = useCallback((node: HTMLDivElement | null) => {
    gridObserver.current?.disconnect();
    if (!node) return;
    const measure = () => setColumns(Math.max(1, getComputedStyle(node).gridTemplateColumns.split(' ').length));
    gridObserver.current = new ResizeObserver(measure);
    gridObserver.current.observe(node);
    measure();
  }, []);
  const hasMore = page < totalPages;
  const visible = completeRows(results, columns, hasMore);
  const loadMore = () => void load(query.trim(), page + 1, true);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; });
  const observer = useRef<IntersectionObserver | null>(null);
  // The button doubles as the infinite-scroll trigger: it remounts after each page, so a tall screen keeps filling.
  const loadMoreSentinel = useCallback((node: HTMLButtonElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    observer.current = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); }, { rootMargin: '0px 0px 600px' });
    observer.current.observe(node);
  }, []);

  function search() {
    const searchQuery = query.trim();
    history.replaceState({ ...(history.state || {}), view: 'discovery' }, '', searchQuery ? `/discovery?q=${encodeURIComponent(searchQuery)}` : '/discovery');
    void load(searchQuery, 1);
  }

  useEffect(() => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(search, 250);
    return () => { if (searchTimer.current !== null) window.clearTimeout(searchTimer.current); };
    // A new query supersedes the previous request; search intentionally captures the current API client closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, refreshKey]);

  return {
    query, setQuery, results, visible, loading, error, hasMore, measureGrid, loadMore, loadMoreSentinel,
    /** Enter skips the debounce. */
    searchNow: () => { if (searchTimer.current !== null) window.clearTimeout(searchTimer.current); search(); },
    retry: () => void load(query.trim(), 1),
  };
}
