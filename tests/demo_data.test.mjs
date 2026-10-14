import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createDemoDashboard, demoArrMediaMatch, demoDiscovery, demoPlexLibraryMatch, demoProfileNames } from '../server/demo_data.js';

test('Discover offers titles that are neither in the library nor requested, on its first page, in every profile', () => {
  for (const profile of demoProfileNames) {
    const dashboard = createDemoDashboard(profile);
    // a title already in a download queue is not one you would request
    const requested = new Set([...dashboard.requests, ...dashboard.pipeline].map((item) => String(item.tmdbId)));
    const requestable = demoDiscovery('', 1, profile).results.filter((item) => {
      const title = item.title || item.name;
      return demoPlexLibraryMatch(item.id, title, profile).status === 'missing'
        && demoArrMediaMatch(item.id, item.media_type, title, profile).status !== 'tracked'
        && !requested.has(String(item.id));
    });
    assert.ok(requestable.length >= 1, `${profile}: nothing to request on the first Discover page`);
  }
});

test('every demo poster exists in public/demo/posters', () => {
  for (const profile of demoProfileNames) {
    const discover = Array.from({ length: demoDiscovery('', 1, profile).total_pages }, (_, index) => demoDiscovery('', index + 1, profile).results).flat();
    for (const item of [...createDemoDashboard(profile).allMedia, ...discover]) {
      assert.ok(existsSync(new URL(`../public${item.poster}`, import.meta.url)), `${profile}: ${item.title} has no poster at ${item.poster}`);
    }
  }
});
