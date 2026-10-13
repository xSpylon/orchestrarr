import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarEntry, calendarPath } from '../server/calendar.js';

test('calendarPath asks Sonarr for the series so entries carry the show, not the episode title', () => {
  assert.match(calendarPath('Sonarr', '2026-08-01', '2026-08-31'), /includeSeries=true/);
  assert.doesNotMatch(calendarPath('Radarr', '2026-08-01', '2026-08-31'), /includeSeries/);
});

test('a Sonarr episode is titled and identified by its series', () => {
  const item = { title: 'Home', seasonNumber: 4, episodeNumber: 1, airDateUtc: '2026-08-05T04:00:00Z', id: 116, series: { title: 'Ted Lasso', tmdbId: 97546 } };
  const entry = calendarEntry(item, 'Sonarr');
  assert.equal(entry.title, 'Ted Lasso');
  assert.equal(entry.tmdbId, 97546);
  assert.equal(entry.detail, 'S04 E01 · Home');
});

test('a Radarr movie keeps the tmdbId Radarr puts on the movie itself', () => {
  const entry = calendarEntry({ title: 'Unabomber', tmdbId: 1492640, digitalRelease: '2026-09-01T00:00:00Z', id: 9 }, 'Radarr');
  assert.equal(entry.title, 'Unabomber');
  assert.equal(entry.tmdbId, 1492640);
});
