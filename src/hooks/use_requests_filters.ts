import { useEffect, useMemo, useState } from 'react';
import type { DashboardItem } from '@/types/dashboard.types';
import { displayText } from '@/helpers/format';
import { requestsSearch, requestsState, type RequestsSort } from '@/helpers/requests_url';

export type { RequestsSort } from '@/helpers/requests_url';
const PAGE_SIZE = 12;

/** Request tab, search, type, requester, sort and page, mirrored into the /requests URL. */
export function useRequestsFilters(items: DashboardItem[]) {
  const [initial] = useState(() => requestsState(new URLSearchParams(window.location.search)));
  const [filter, setFilter] = useState<string>(initial.filter);
  const [query, setQuery] = useState(initial.query);
  const [type, setType] = useState(initial.type);
  const [requester, setRequester] = useState(initial.requester);
  const [page, setPage] = useState(initial.page);
  const [sort, setSort] = useState<RequestsSort>(initial.sort);
  const requesters = [...new Set(items.map((item) => item.requester).filter((value): value is string => Boolean(value)))].sort();
  const filtered = useMemo(() => items.filter((item) => {
    const state = String(item.state || '');
    const matchesTab = filter === 'all' || (filter === 'approval' ? ['Pending', 'Requested'].includes(state) : state === 'Available');
    const matchesType = type === 'all' || String(item.detail || '').toLowerCase().includes(type);
    const matchesRequester = requester === 'all' || item.requester === requester;
    const searchText = `${displayText(item.title)} ${item.requester || ''} ${state} ${item.detail || ''}`.toLowerCase();
    return matchesTab && matchesType && matchesRequester && (!query.trim() || searchText.includes(query.trim().toLowerCase()));
  }).sort((left, right) => sort === 'title' ? left.title.localeCompare(right.title) : sort === 'requester' ? String(left.requester || '').localeCompare(String(right.requester || '')) : sort === 'state' ? String(left.state || '').localeCompare(String(right.state || '')) : 0), [filter, items, query, requester, sort, type]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, pageCount);
  const start = (activePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, activePage * PAGE_SIZE);

  useEffect(() => {
    window.history.replaceState({ ...(window.history.state || {}), view: 'requests' }, '', `/requests${requestsSearch({ filter: filter === 'all' ? 'all' : 'approval', query, type, requester, sort, page: activePage })}`);
  }, [activePage, filter, query, requester, sort, type]);

  // Changing what is listed starts again at page 1.
  const resetting = <T,>(set: (value: T) => void) => (value: T) => { set(value); setPage(1); };
  return {
    filter, query, type, requester, sort, requesters, filtered, visible, start, activePage, pageCount, setPage,
    setFilter: resetting(setFilter), setQuery: resetting(setQuery), setType: resetting(setType),
    setRequester: resetting(setRequester), setSort: resetting<RequestsSort>(setSort),
  };
}

export type RequestsFilterState = ReturnType<typeof useRequestsFilters>;
