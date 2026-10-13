import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptDiscovery, appendUnique, completeRows } from '../src/helpers/discover.ts';

test('adaptDiscovery drops people and fills fallbacks', () => {
  const items = adaptDiscovery({ results: [
    { id: 1, media_type: 'person', name: 'Someone' },
    { id: 2, name: 'Show', first_air_date: '2024-01-02', poster_path: '/p.jpg' },
    { id: 3 },
  ] });
  assert.deepEqual(items.map((item) => [item.id, item.mediaType, item.title, item.detail]), [['2', 'tv', 'Show', '2024-01-02'], ['3', 'movie', 'Untitled', 'Date unavailable']]);
  assert.equal(items[0].poster, '/api/discovery-artwork?size=w342&path=%2Fp.jpg');
  assert.equal(items[1].poster, '');
  assert.equal(items[1].overview, 'No synopsis available.');
});

test('adaptDiscovery keeps direct local poster paths for demo data', () => {
  const items = adaptDiscovery({ results: [{ id: 900001, title: 'Demo title', media_type: 'movie', poster: '/demo/posters/quiet_signal.png', poster_path: '/remote.jpg' }] });
  assert.equal(items[0].poster, '/demo/posters/quiet_signal.png');
});

test('appendUnique skips titles already listed with the same media type', () => {
  const merged = appendUnique([{ id: '1', title: 'A', mediaType: 'movie' }], [{ id: '1', title: 'A', mediaType: 'movie' }, { id: '1', title: 'B', mediaType: 'tv' }]);
  assert.deepEqual(merged.map((item) => item.title), ['A', 'B']);
});

test('completeRows trims to full rows only while more pages exist', () => {
  const items = Array.from({ length: 10 }, (_, id) => ({ id, title: String(id) }));
  assert.equal(completeRows(items, 4, true).length, 8);
  assert.equal(completeRows(items, 4, false).length, 10);
  assert.equal(completeRows(items.slice(0, 3), 4, true).length, 3);
});
