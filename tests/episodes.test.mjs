import test from 'node:test';
import assert from 'node:assert/strict';
import { canSearchEpisode, episodeStatus } from '../src/helpers/episodes.ts';

const base = { id: 1, episodeNumber: 1, title: 'Pilot', airDateUtc: '2020-01-01T00:00:00Z', hasFile: false, monitored: true, source: 'sonarr' };
const future = new Date(Date.now() + 86_400_000).toISOString();

test('episodeStatus follows the Sonarr lifecycle', () => {
  assert.equal(episodeStatus({ ...base, source: 'tmdb' }), 'Not tracked');
  assert.equal(episodeStatus({ ...base, queue: { status: 'Downloading', detail: '', progress: 40 } }), 'Downloading');
  assert.equal(episodeStatus({ ...base, hasFile: true }), 'Available');
  assert.equal(episodeStatus({ ...base, monitored: false }), 'Unmonitored');
  assert.equal(episodeStatus({ ...base, airDateUtc: future }), 'Upcoming');
  assert.equal(episodeStatus({ ...base, airDateUtc: '', title: 'TBA' }), 'Upcoming');
  assert.equal(episodeStatus(base), 'Missing');
});

test('canSearchEpisode allows missing and failed queue items only', () => {
  assert.equal(canSearchEpisode(base), true);
  assert.equal(canSearchEpisode({ ...base, hasFile: true }), false);
  assert.equal(canSearchEpisode({ ...base, queue: { status: 'Warning', detail: '', progress: 0 } }), true);
  assert.equal(canSearchEpisode({ ...base, queue: { status: 'Downloading', detail: '', progress: 10 } }), false);
});
