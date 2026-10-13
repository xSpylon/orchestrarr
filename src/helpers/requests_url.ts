export type RequestsSort = 'recent' | 'title' | 'requester' | 'state';
export type RequestsUrlState = { filter: 'approval' | 'all'; query: string; type: string; requester: string; sort: RequestsSort; page: number };

const SORTS: RequestsSort[] = ['recent', 'title', 'requester', 'state'];

// Reading and writing live side by side so they cannot drift apart again: defaults stay out of the URL,
// everything else round-trips (the "Needs approval" tab is the default, so only "All requests" is written).
export function requestsState(params: URLSearchParams): RequestsUrlState {
  const sort = params.get('sort') as RequestsSort;
  return {
    filter: params.get('filter') === 'all' ? 'all' : 'approval',
    query: params.get('search') || '',
    type: params.get('type') || 'all',
    requester: params.get('requester') || 'all',
    sort: SORTS.includes(sort) ? sort : 'recent',
    page: Math.max(1, Number(params.get('page') || 1)),
  };
}

export function requestsSearch(state: RequestsUrlState): string {
  const params = new URLSearchParams();
  if (state.query) params.set('search', state.query);
  if (state.filter === 'all') params.set('filter', 'all');
  if (state.type !== 'all') params.set('type', state.type);
  if (state.requester !== 'all') params.set('requester', state.requester);
  if (state.sort !== 'recent') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  return params.size ? `?${params}` : '';
}
