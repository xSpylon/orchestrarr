import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaKind, recentShows } from '../src/helpers/library.ts';

test('mediaKind reads the type first, then the library name', () => {
  assert.equal(mediaKind({ title: 'A', type: 'movie' }), 'movie');
  assert.equal(mediaKind({ title: 'A', type: 'episode' }), 'show');
  assert.equal(mediaKind({ title: 'A', library: 'TV Shows' }), 'show');
  assert.equal(mediaKind({ title: 'A', library: 'Movies 4K' }), 'movie');
  assert.equal(mediaKind({ title: 'A', type: 'track', library: 'Music' }), null);
});

test('recentShows collapses episodes into one card per show', () => {
  const cards = recentShows([
    { title: 'Pilot', grandparentTitle: 'Severance', grandparentRatingKey: '9' },
    { title: 'Episode 2', grandparentTitle: 'Severance', grandparentRatingKey: '9' },
    { title: 'Andor', ratingKey: '5', thumb: '/t.jpg' },
  ]);
  assert.equal(cards.length, 2);
  assert.deepEqual([cards[0].title, cards[0].ratingKey, cards[0].type, cards[0].thumb, cards[0].recentEpisode], ['Severance', '9', 'show', '/api/media/9/artwork', 'Pilot']);
  assert.deepEqual([cards[1].title, cards[1].thumb, cards[1].recentEpisode], ['Andor', '/t.jpg', undefined]);
});
