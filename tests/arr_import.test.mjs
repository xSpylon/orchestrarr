import test from 'node:test';
import assert from 'node:assert/strict';
import { canImportNow, manualImportFiles } from '../server/arr_import.js';

const quality = { quality: { id: 19, name: 'Bluray-2160p' }, revision: { version: 2 } };
const languages = [{ id: 1, name: 'English' }];

test('only a finished download stuck on import can be imported now', () => {
  assert.equal(canImportNow({ status: 'completed', trackedDownloadStatus: 'warning', trackedDownloadState: 'importBlocked' }), true);
  assert.equal(canImportNow({ status: 'completed', trackedDownloadStatus: 'warning', trackedDownloadState: 'importPending' }), true);
  assert.equal(canImportNow({ status: 'downloading', trackedDownloadStatus: 'warning', trackedDownloadState: 'importBlocked' }), false, 'still downloading');
  assert.equal(canImportNow({ status: 'completed', trackedDownloadStatus: 'ok', trackedDownloadState: 'importPending' }), false, 'Radarr is importing it by itself');
  assert.equal(canImportNow({ status: 'completed', trackedDownloadStatus: 'error', trackedDownloadState: 'failedPending' }), false, 'a failed download is for Blocklist, not import');
});

test('a Radarr file falls back to the queue\'s movie when the release name could not be matched', () => {
  const candidates = [{ path: '/dl/Alien.R2.S.E.mkv', movie: null, quality, languages, releaseGroup: 'KC', rejections: [{ reason: 'Matched by ID' }] }];
  assert.deepEqual(manualImportFiles('Radarr', candidates, { movieId: 559, downloadId: 'ABC' }), [
    { path: '/dl/Alien.R2.S.E.mkv', movieId: 559, downloadId: 'ABC', quality, languages, releaseGroup: 'KC', indexerFlags: 0 }
  ]);
});

test('samples are never imported', () => {
  const candidates = [
    { path: '/dl/movie.mkv', movie: { id: 5 }, quality, languages },
    { path: '/dl/sample.mkv', movie: { id: 5 }, quality, languages, rejections: [{ reason: 'Sample' }] }
  ];
  assert.deepEqual(manualImportFiles('Radarr', candidates, { movieId: 5, downloadId: 'X' }).map((file) => file.path), ['/dl/movie.mkv']);
});

test('Sonarr files need their episodes; without them the import stops with a reason', () => {
  const ok = [{ path: '/dl/S01E01.mkv', series: { id: 7 }, episodes: [{ id: 70 }], quality, languages }];
  assert.deepEqual(manualImportFiles('Sonarr', ok, { seriesId: 7, downloadId: 'Y' }), [
    { path: '/dl/S01E01.mkv', seriesId: 7, episodeIds: [70], downloadId: 'Y', quality, languages, releaseGroup: undefined, indexerFlags: 0 }
  ]);
  assert.throws(() => manualImportFiles('Sonarr', [{ path: '/dl/x.mkv', series: { id: 7 }, episodes: [], quality, languages }], { seriesId: 7, downloadId: 'Y' }), /episodes/);
});

test('nothing to import is an error, not a silent success', () => {
  assert.throws(() => manualImportFiles('Radarr', [], { movieId: 1, downloadId: 'Z' }), /No importable/);
});
