import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAppRoute } from '../src/helpers/app_route.ts';
import { mediaTypeOf, uniqueTmdbMatch } from '../src/helpers/title_match.ts';

test('the root and plain pages resolve to their view', () => {
  assert.equal(parseAppRoute('/').view, 'overview');
  assert.equal(parseAppRoute('/servers').view, 'servers');
  assert.equal(parseAppRoute('/requests').view, 'requests');
  assert.equal(parseAppRoute('/about').view, 'about');
});

test('a canonical title is a media page with its type, id and focus', () => {
  const route = parseAppRoute('/title/tv/1399/s1e2');
  assert.equal(route.view, 'media');
  assert.equal(route.isCanonicalTitle, true);
  assert.equal(route.titleMediaType, 'tv');
  assert.equal(route.itemKey, '1399');
  assert.deepEqual(route.routeFocus, { kind: 'episode', seasonNumber: 1, episodeNumber: 2 });
  assert.equal(parseAppRoute('/title/book/1').isCanonicalTitle, false);
});

test('media type is read from type, mediaType or detail', () => {
  assert.equal(mediaTypeOf({ type: 'show' }), 'tv');
  assert.equal(mediaTypeOf({ detail: 'S1 E2 · episode' }), 'tv');
  assert.equal(mediaTypeOf({ type: 'movie' }), 'movie');
});

test('only one same-type, same-title, same-year result counts as a match', () => {
  const results = [{ id: 1, title: 'Dune', media_type: 'movie', release_date: '1984-12-14' }, { id: 2, title: 'Dune', media_type: 'movie', release_date: '2021-09-15' }, { id: 3, name: 'Dune', first_air_date: '2000-12-03' }];
  assert.equal(uniqueTmdbMatch(results, 'Dune', 'movie', ''), '');
  assert.equal(uniqueTmdbMatch(results, 'Dune', 'movie', 2021), '2');
  assert.equal(uniqueTmdbMatch(results, 'Dune!', 'tv', undefined), '3');
});
