import test from 'node:test';
import assert from 'node:assert/strict';
import { nextServiceHistory } from '../server/service_events.js';

const at = '2026-10-08T10:00:00.000Z';
const later = '2026-10-08T11:00:00.000Z';

test('a healthy service seen for the first time is stored without an event', () => {
  const history = nextServiceHistory([], { name: 'Radarr', state: 'Healthy', detail: '17 queue items' }, at);
  assert.deepEqual(history, [{ type: 'baseline', state: 'Healthy', at, silent: true }]);
});

test('a service with a problem on first sight logs one event', () => {
  const history = nextServiceHistory([], { name: 'Prowlarr', state: 'Attention', detail: '6 health issues' }, at);
  assert.equal(history.length, 1);
  assert.equal(history[0].title, 'Prowlarr: Attention');
  assert.equal(history[0].at, at);
});

test('an unchanged state keeps the original timestamp', () => {
  const first = nextServiceHistory([], { name: 'Prowlarr', state: 'Attention' }, at);
  assert.equal(nextServiceHistory(first, { name: 'Prowlarr', state: 'Attention' }, later), first);
});

test('state changes, including recovery, are logged', () => {
  const first = nextServiceHistory([], { name: 'Prowlarr', state: 'Attention' }, at);
  const recovered = nextServiceHistory(first, { name: 'Prowlarr', state: 'Healthy', detail: 'All indexers OK' }, later);
  assert.equal(recovered.length, 2);
  assert.equal(recovered[1].title, 'Prowlarr: Healthy');
  assert.equal(recovered[1].at, later);
});

test('a deliberately unconfigured service is not a problem', async () => {
  const { problemStates } = await import('../server/service_events.js');
  assert.equal(problemStates.includes('Not configured'), false);
});

test('stackHealth leaves unconfigured services out of the total and the label', async () => {
  const { stackHealth } = await import('../server/service_events.js');
  const services = [{ name: 'Plex', state: 'Healthy' }, { name: 'Sonarr', state: 'Healthy' }, { name: 'SABnzbd', state: 'Not configured' }];
  assert.deepEqual(stackHealth(services), { online: 2, total: 2, label: 'All systems nominal' });
  assert.deepEqual(stackHealth([...services, { name: 'Prowlarr', state: 'Attention' }]), { online: 2, total: 3, label: 'Attention required' });
});
