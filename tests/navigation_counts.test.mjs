import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationCounts } from '../src/helpers/navigation_counts.ts';

test('counts only what needs attention, and sums them per group', () => {
  const { counts, groupCounts, unresolvedAlerts } = navigationCounts({
    alerts: [{ resolved: false }, { resolved: true }],
    pipeline: [{ needsAction: true }, { needsAction: false }],
    requests: [{ state: 'Pending' }, { state: 'Available' }, { state: 'Requested' }],
    streams: [{}],
  });
  assert.deepEqual(counts, { requests: 2, pipeline: 1, activity: 1, streams: 1 });
  assert.deepEqual(groupCounts, { Acquisition: 3, Observe: 1 });
  assert.equal(unresolvedAlerts, 1);
});

test('no dashboard means no counts', () => {
  assert.deepEqual(navigationCounts(null).groupCounts, { Acquisition: 0, Observe: 0 });
});
