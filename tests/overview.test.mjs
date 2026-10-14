import test from 'node:test';
import assert from 'node:assert/strict';
import { isReachable, isOffline } from '../src/helpers/overview.ts';

test('a service is reachable only when its state is healthy and not an error', () => {
  assert.equal(isReachable({ state: 'Healthy' }), true);
  assert.equal(isReachable({ state: 'Connected' }), true);
  assert.equal(isReachable({ state: 'Online, error on last sync' }), false);
  assert.equal(isReachable({ state: 'Offline' }), false);
  assert.equal(isReachable(undefined), false);
});

test('not configured services do not count as offline', () => {
  assert.equal(isOffline({ state: 'Unreachable' }), true);
  assert.equal(isOffline({ state: 'Not configured' }), false);
  assert.equal(isOffline({ state: 'Healthy' }), false);
});
