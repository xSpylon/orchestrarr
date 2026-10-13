import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeDiscoveryPages } from '../server/discovery.js';

test('mergeDiscoveryPages keeps TMDb total_pages so the client knows more pages exist', () => {
  const merged = mergeDiscoveryPages([{ total_pages: 500, results: [{ id: 1, media_type: 'movie' }] }]);
  assert.equal(merged.total_pages, 500);
});

test('mergeDiscoveryPages drops duplicates across pages and entries without an id', () => {
  const merged = mergeDiscoveryPages([
    { total_pages: 3, results: [{ id: 1, media_type: 'movie' }, { id: 2, media_type: 'tv' }] },
    { total_pages: 3, results: [{ id: 1, media_type: 'movie' }, { id: 1, media_type: 'tv' }, { media_type: 'movie' }] }
  ]);
  assert.deepEqual(merged.results.map((item) => `${item.media_type}-${item.id}`), ['movie-1', 'tv-2', 'tv-1']);
});

test('mergeDiscoveryPages caps total_pages at TMDb\'s 500-page limit', () => {
  assert.equal(mergeDiscoveryPages([{ total_pages: 9000, results: [] }]).total_pages, 500);
});
