import test from 'node:test';
import assert from 'node:assert/strict';
import { requestsSearch, requestsState } from '../src/helpers/requests_url.ts';

const defaults = { filter: 'approval', query: '', type: 'all', requester: 'all', sort: 'recent', page: 1 };

test('the default tab (Needs approval) stays out of the URL', () => {
  assert.equal(requestsSearch(defaults), '');
});

test('All requests is written as filter=all, so a reload or shared link keeps it', () => {
  assert.equal(requestsSearch({ ...defaults, filter: 'all' }), '?filter=all');
});

test('reading a URL gives back the state that wrote it', () => {
  const state = { filter: 'all', query: 'dune', type: 'movie', requester: 'sven', sort: 'title', page: 3 };
  assert.deepEqual(requestsState(new URLSearchParams(requestsSearch(state))), state);
  assert.deepEqual(requestsState(new URLSearchParams('')), defaults);
});
