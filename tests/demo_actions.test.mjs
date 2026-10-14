import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoDashboard } from '../server/demo_data.js';
import { createDemoActions } from '../server/demo_actions.js';

const base = createDemoDashboard('medium');
const pending = base.requests.find((item) => item.state === 'Pending');
const failedImport = base.pipeline.find((item) => item.importAction);
const stalled = base.pipeline.find((item) => item.blocklistAction && !item.importAction);
const downloading = base.pipeline.find((item) => item.state === 'Downloading');
const searchable = base.pipeline.find((item) => item.retryAction === 'search' && item.state !== 'Downloading');

test('a visitor without changes sees the demo data as it is', () => {
  const demo = createDemoActions();
  assert.equal(demo.apply('nobody', base), base);
});

test('approving and declining change the request, with an event for the activity feed', () => {
  const demo = createDemoActions();
  demo.act('a', 'approve', { requestId: pending.requestId });
  const approved = demo.apply('a', base).requests.find((item) => item.requestId === pending.requestId);
  assert.equal(approved.state, 'Approved');
  assert.equal(approved.events.at(-1).title, 'Approved');
  demo.act('a', 'decline', { requestId: pending.requestId });
  assert.equal(demo.apply('a', base).requests.find((item) => item.requestId === pending.requestId).state, 'Declined');
});

test('queue actions import, blocklist, pause, resume and search the right item', () => {
  const demo = createDemoActions();
  demo.act('a', 'import', { service: failedImport.service, queueId: failedImport.queueId });
  demo.act('a', 'blocklist', { service: stalled.service, queueId: stalled.queueId });
  demo.act('a', 'pause', { torrentHash: downloading.torrentHash });
  demo.act('a', 'search', { service: searchable.service, actionId: searchable.actionId });
  const { pipeline } = demo.apply('a', base);
  assert.equal(pipeline.length, base.pipeline.length - 1, 'an imported download leaves the queue');
  assert.equal(pipeline.find((item) => item.queueId === failedImport.queueId), undefined);
  const blocklisted = pipeline.find((item) => item.queueId === stalled.queueId);
  assert.deepEqual([blocklisted.state, blocklisted.needsAction, blocklisted.blocklistAction], ['Searching', false, false]);
  assert.equal(pipeline.find((item) => item.torrentHash === downloading.torrentHash).state, 'Paused');
  assert.equal(pipeline.find((item) => item.actionId === searchable.actionId).state, 'Searching');
  demo.act('a', 'resume', { torrentHash: downloading.torrentHash });
  assert.equal(demo.apply('a', base).pipeline.find((item) => item.torrentHash === downloading.torrentHash).state, 'Downloading');
});

test('a new request shows up first, once, and can then be approved', () => {
  const demo = createDemoActions();
  const title = { title: 'Paper Atlas', tmdbId: 990001, mediaType: 'tv', detail: 'Series · 2 seasons' };
  const created = demo.act('a', 'request', title);
  demo.act('a', 'request', title);
  const { requests } = demo.apply('a', base);
  assert.equal(requests.length, base.requests.length + 1);
  assert.deepEqual([requests[0].title, requests[0].state, requests[0].requester], ['Paper Atlas', 'Pending', 'You']);
  demo.act('a', 'approve', { requestId: created.requestId });
  assert.equal(demo.apply('a', base).requests[0].state, 'Approved');
});

test('resolved alerts stay resolved for that visitor only', () => {
  const demo = createDemoActions();
  demo.act('a', 'resolve', { id: 'pipeline-x', action: 'resolved' });
  assert.equal(demo.resolved('a', 'pipeline-x'), true);
  assert.equal(demo.resolved('b', 'pipeline-x'), false);
  demo.act('a', 'resolve', { id: 'pipeline-x', action: 'unresolved' });
  assert.equal(demo.resolved('a', 'pipeline-x'), false);
});

test('visitors never see each other\'s changes', () => {
  const demo = createDemoActions();
  demo.act('a', 'approve', { requestId: pending.requestId });
  demo.act('b', 'request', { title: 'Paper Atlas', tmdbId: 990001, mediaType: 'tv' });
  assert.equal(demo.apply('b', base).requests.find((item) => item.requestId === pending.requestId).state, 'Pending');
  assert.equal(demo.apply('a', base).requests.length, base.requests.length);
});

test('memory stays bounded: old visitors are dropped and each visitor has a change limit', () => {
  const demo = createDemoActions({ maxSessions: 2, maxChanges: 3 });
  demo.act('a', 'pause', { torrentHash: downloading.torrentHash });
  demo.act('b', 'pause', { torrentHash: downloading.torrentHash });
  demo.act('c', 'pause', { torrentHash: downloading.torrentHash });
  assert.equal(demo.apply('a', base), base, 'the oldest visitor is forgotten');
  demo.act('c', 'resume', { torrentHash: downloading.torrentHash });
  demo.act('c', 'pause', { torrentHash: downloading.torrentHash });
  assert.throws(() => demo.act('c', 'resume', { torrentHash: downloading.torrentHash }), /demo/i);
});

test('unknown actions and missing ids are refused', () => {
  const demo = createDemoActions();
  assert.throws(() => demo.act('a', 'delete-everything', {}), /Unsupported/);
  assert.throws(() => demo.act('a', 'approve', {}), /required/);
});

test('the demo tour ticks off requesting, approving, importing and inviting', () => {
  const demo = createDemoActions();
  assert.equal(demo.apply('a', base).demoTour, undefined, 'no tour progress before any action');
  demo.act('a', 'request', { title: 'Daybreak Motel', tmdbId: 900010, mediaType: 'movie' });
  assert.deepEqual(demo.apply('a', base).demoTour, { requested: true, approved: false, declined: false, imported: false, paused: false, blocklisted: false, invited: false, removed: false });
  demo.act('a', 'approve', { requestId: 'demo-900010' });
  demo.act('a', 'import', { service: failedImport.service, queueId: failedImport.queueId });
  demo.act('a', 'decline', { requestId: pending.requestId });
  demo.act('a', 'pause', { torrentHash: downloading.torrentHash });
  demo.act('a', 'blocklist', { service: stalled.service, queueId: stalled.queueId });
  demo.act('a', 'invite');
  demo.act('a', 'remove', { userId: '501' });
  assert.deepEqual(demo.apply('a', base).demoTour, { requested: true, approved: true, declined: true, imported: true, paused: true, blocklisted: true, invited: true, removed: true });
});

test('a removed user stays gone from that visitor\'s Access list only', () => {
  const demo = createDemoActions();
  const management = { users: [{ id: 500, username: 'Sven' }, { id: 501, username: 'Jules' }], invitations: [] };
  demo.act('a', 'remove', { userId: '501' });
  assert.deepEqual(demo.applyAccess('a', management).users.map((user) => user.username), ['Sven']);
  assert.equal(demo.applyAccess('b', management), management);
  assert.throws(() => demo.act('a', 'remove', {}), /required/);
});
