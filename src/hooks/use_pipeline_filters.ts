import { useEffect, useMemo, useState } from 'react';
import type { DashboardItem } from '@/types/dashboard.types';

export type PipelineSort = 'updated' | 'title' | 'service';
const SORTS: PipelineSort[] = ['updated', 'title', 'service'];

/** Queue search, service, state and sort, mirrored into the /pipeline URL. */
export function usePipelineFilters(items: DashboardItem[]) {
  const [initialParams] = useState(() => new URLSearchParams(window.location.search));
  const [query, setQuery] = useState(initialParams.get('search') || '');
  const [service, setService] = useState(initialParams.get('service') || 'all');
  const [state, setState] = useState(initialParams.get('state') || 'all');
  const [sort, setSort] = useState<PipelineSort>(SORTS.includes(initialParams.get('sort') as PipelineSort) ? initialParams.get('sort') as PipelineSort : 'updated');
  const services = [...new Set(items.map((item) => item.service).filter((value): value is string => Boolean(value)))].sort();
  const states = [...new Set(items.map((item) => item.state).filter((value): value is string => Boolean(value)))].sort();
  const filtered = useMemo(() => items.filter((item) => {
    const matchesSearch = !query.trim() || `${item.title} ${item.detail || ''} ${item.service || ''} ${item.state || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSearch && (service === 'all' || item.service === service) && (state === 'all' || item.state === state);
  }).sort((left, right) => sort === 'title' ? left.title.localeCompare(right.title) : sort === 'service' ? String(left.service || '').localeCompare(String(right.service || '')) : (Date.parse(String(right.updated || '')) || 0) - (Date.parse(String(left.updated || '')) || 0)), [items, query, service, sort, state]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (service !== 'all') params.set('service', service);
    if (state !== 'all') params.set('state', state);
    if (sort !== 'updated') params.set('sort', sort);
    window.history.replaceState({ ...(window.history.state || {}), view: 'pipeline' }, '', `/pipeline${params.size ? `?${params}` : ''}`);
  }, [query, service, sort, state]);
  return {
    query, service, state, sort, services, states, filtered,
    setQuery, setService, setState, setSort,
    isFiltered: Boolean(query) || service !== 'all' || state !== 'all' || sort !== 'updated',
    clear: () => { setQuery(''); setService('all'); setState('all'); setSort('updated'); },
  };
}

export type PipelineFilterState = ReturnType<typeof usePipelineFilters>;
