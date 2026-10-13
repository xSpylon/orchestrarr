import test from 'node:test';
import assert from 'node:assert/strict';
import { arrMediaUrl } from '../server/arr.js';

const base = 'http://radarr:7878';

test('a Radarr link uses the movie slug (its TMDb id), not Radarr\'s internal id', () => {
  assert.equal(arrMediaUrl(base, 'Radarr', { id: 813, tmdbId: 346648, titleSlug: '346648' }), 'http://radarr:7878/movie/346648');
});

test('without a slug a Radarr link falls back to the TMDb id', () => {
  assert.equal(arrMediaUrl(base, 'Radarr', { id: 813, tmdbId: 346648 }), 'http://radarr:7878/movie/346648');
});

test('a Sonarr link uses the series slug', () => {
  assert.equal(arrMediaUrl('http://sonarr:8989', 'Sonarr', { id: 116, titleSlug: 'ted-lasso' }), 'http://sonarr:8989/series/ted-lasso');
});

test('with nothing to identify the title, the link goes to the app itself', () => {
  assert.equal(arrMediaUrl(base, 'Radarr', {}), base);
});
