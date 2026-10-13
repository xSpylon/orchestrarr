import test from 'node:test';
import assert from 'node:assert/strict';
import { itemDetailFields } from '../src/helpers/item_detail_fields.ts';

test('a service shows its health rows and hides empty ones', () => {
  const rows = itemDetailFields({ name: 'Sonarr', state: 'Healthy', detail: 'ok', latencyMs: 12 });
  assert.deepEqual(rows.map(([label]) => label), ['Status', 'Details', 'Source', 'Latency']);
  assert.deepEqual(rows[3], ['Latency', '12 ms']);
});

test('a service includes freshness and metrics when they are available', () => {
  const rows = Object.fromEntries(itemDetailFields({ name: 'Plex', state: 'Healthy', detail: 'ok', checkedAt: '2026-10-07T16:37:00.000Z', freshness: { ageSeconds: 3 }, metrics: { streams: 2 } }));
  assert.equal(rows.Freshness, '3s old');
  assert.equal(rows.Metrics, JSON.stringify({ streams: 2 }, null, 2));
});

test('an alert shows its resolution, and keeps empty rows when it names a service', () => {
  const rows = itemDetailFields({ title: 'Disk', resolved: false, service: 'Radarr' });
  assert.deepEqual(Object.fromEntries(rows).Resolution, 'Open');
  assert.equal(Object.fromEntries(rows)['Related item'], '—');
});

test('a pipeline item shows progress', () => {
  assert.deepEqual(itemDetailFields({ title: 'x', state: 'Downloading', progress: 40 }).find(([label]) => label === 'Progress'), ['Progress', '40%']);
});
