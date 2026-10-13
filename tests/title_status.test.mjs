import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTitleStatus, findFocusedEpisode, matchTitleRecords, mediaTypeOf, stageIndex, titleFacts } from '../src/helpers/title_status.ts';

const loading = { status: 'loading' };
const base = {
  dashboard: { services: [{ name: 'Plex', state: 'Healthy' }, { name: 'Radarr', state: 'Healthy' }], links: { jellyseerr: 'https://js.local/', plex: 'https://plex.local' } },
  mediaType: 'movie',
  matchedPipeline: [],
  seriesAvailability: {},
  availabilityLoading: false,
  arrMediaMatch: loading,
  plexLibraryMatch: loading,
  bazarrMediaStatus: loading,
  tautulliHistory: { status: 'loading', history: [] },
  playback: [],
  activeStreams: [],
  requestSubmitted: false,
};
const row = (status, name) => status.serviceRows.find((entry) => entry.name === name);

test('mediaTypeOf and stageIndex classify titles and states', () => {
  assert.equal(mediaTypeOf({ type: 'Series' }), 'tv');
  assert.equal(mediaTypeOf({ type: 'Movie' }), 'movie');
  assert.equal(stageIndex('Downloading'), 3);
  assert.equal(stageIndex('Approved'), 1);
  assert.equal(stageIndex('whatever'), -1);
});

test('status stays unresolved while Plex and Radarr are still checking', () => {
  const status = deriveTitleStatus(base);
  assert.equal(status.statusResolved, false);
  assert.equal(status.showRequestAction, false);
  assert.equal(row(status, 'Radarr').context, 'Checking Radarr library');
  assert.equal(row(status, 'Plex').context, 'Checking library');
  assert.equal(row(status, 'Jellyseerr').url, 'https://js.local/discover');
});

test('a movie missing everywhere offers a request', () => {
  const status = deriveTitleStatus({ ...base, arrMediaMatch: { status: 'not-tracked', detail: 'Not in Radarr' }, plexLibraryMatch: { status: 'missing' }, tautulliHistory: { status: 'ready', history: [] } });
  assert.equal(status.statusResolved, true);
  assert.equal(status.isAvailable, false);
  assert.equal(status.showRequestAction, true);
  assert.equal(row(status, 'Radarr').tone, 'media');
  assert.equal(row(status, 'Plex').tone, 'media');
  assert.equal(row(status, 'Tautulli').context, 'No matching playback');
  assert.equal(deriveTitleStatus({ ...base, arrMediaMatch: { status: 'unresolved' }, plexLibraryMatch: { status: 'missing' } }).showRequestAction, false);
});

test('Plex found makes the title available and completes every stage', () => {
  const status = deriveTitleStatus({ ...base, plexLibraryMatch: { status: 'found', library: 'Films' }, relatedRequest: { title: 'X', state: 'Pending' } });
  assert.equal(status.isAvailable, true);
  assert.equal(status.progressStage, 5);
  assert.equal(row(status, 'Plex').context, 'In Films');
  assert.equal(row(status, 'Jellyseerr').tone, 'warn');
});

test('series availability counts episodes from Sonarr', () => {
  const seasons = [{ seasonNumber: 1, episodeFileCount: 3, totalEpisodeCount: 4, episodes: [{ id: 9, episodeNumber: 2 }] }];
  const tv = { ...base, mediaType: 'tv', seriesAvailability: { configured: true, series: { source: 'sonarr', seriesId: 1, seasons } } };
  const status = deriveTitleStatus(tv);
  assert.equal(row(status, 'Sonarr').context, '1 seasons · 3/4 episodes');
  assert.equal(status.isAvailable, false);
  assert.equal(deriveTitleStatus({ ...tv, availabilityLoading: true }).statusResolved, false);
  assert.equal(findFocusedEpisode(tv.seriesAvailability, { kind: 'episode', seasonNumber: 1, episodeNumber: 2 })?.id, 9);
  assert.equal(findFocusedEpisode(tv.seriesAvailability, { kind: 'season', seasonNumber: 1 }), undefined);
});

test('series status explains configuration, unresolved matches and unavailable lookups', () => {
  const configured = deriveTitleStatus({ ...base, mediaType: 'tv', seriesAvailability: { configured: true } });
  assert.equal(row(configured, 'Sonarr').context, 'No matching series in Sonarr');
  assert.equal(row(configured, 'Sonarr').tone, 'muted');

  const unresolved = deriveTitleStatus({ ...base, mediaType: 'tv', seriesAvailability: { configured: true, sonarrMatchUnresolved: true } });
  assert.equal(row(unresolved, 'Sonarr').context, 'Sonarr match could not be confirmed by TMDb ID');
  assert.equal(unresolved.showRequestAction, false);

  const unavailable = deriveTitleStatus({ ...base, mediaType: 'tv', seriesAvailability: { configured: true, sonarrUnavailable: true } });
  assert.equal(row(unavailable, 'Sonarr').context, 'Sonarr availability unavailable');

  const unconfigured = deriveTitleStatus({ ...base, mediaType: 'tv', seriesAvailability: { configured: false } });
  assert.equal(row(unconfigured, 'Sonarr').context, 'Sonarr not configured');
  assert.equal(row(unconfigured, 'Sonarr').tone, 'muted');
});

test('movie pipeline status includes download progress and service tones reflect outcomes', () => {
  const status = deriveTitleStatus({
    ...base,
    relatedRequest: { title: 'Movie', state: 'Failed', requester: 'Sven' },
    matchedPipeline: [{ service: 'Radarr', state: 'Downloading', progress: 42 }],
    bazarrMediaStatus: { status: 'missing', detail: 'Subtitles wanted' },
    tautulliHistory: { status: 'ready', history: [] },
  });
  assert.equal(row(status, 'Radarr').context, 'Downloading · 42%');
  assert.equal(row(status, 'Jellyseerr').tone, 'bad');
  assert.equal(row(status, 'Bazarr').tone, 'warn');
  assert.equal(status.currentStage, 3);
});

test('titleFacts and matchTitleRecords', () => {
  const facts = titleFacts({ release_date: '2021-05-01', genres: [{ name: 'Drama' }, 'Crime'], runtime: 120, poster_path: '/a.jpg' }, '');
  assert.equal(facts.year, '2021');
  assert.equal(facts.genres, 'Drama, Crime');
  assert.equal(facts.runtime, '120 min');
  assert.equal(facts.image, '/api/discovery-artwork?path=%2Fa.jpg');
  assert.equal(titleFacts(null, '/p.jpg').image, '/p.jpg');
  const records = matchTitleRecords({
    requests: [{ title: 'A', tmdbId: 5, mediaType: 'movie' }],
    pipeline: [{ title: 'A', tmdbId: '5', mediaType: 'movie', service: 'Radarr', sourceId: 1 }, { title: 'A', tmdbId: '5', mediaType: 'movie', service: 'Radarr', sourceId: 1 }],
    activity: [{ title: 'A', tmdbId: 5, mediaType: 'movie' }, { title: 'Other', tmdbId: 7, mediaType: 'movie' }],
  }, '5', 'movie');
  assert.equal(records.relatedRequest?.title, 'A');
  assert.equal(records.matchedPipeline.length, 1);
  assert.equal(records.activity.length, 1);
});
