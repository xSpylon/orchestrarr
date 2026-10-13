import test from 'node:test';
import assert from 'node:assert/strict';
import { dayGroupLabel, formatClock, statusShape } from '../src/helpers/format.ts';

test('statusShape maps service and pipeline states to one of five shapes', () => {
  assert.equal(statusShape('Available'), 'done');
  assert.equal(statusShape('Healthy'), 'done');
  assert.equal(statusShape('Downloading'), 'progress');
  assert.equal(statusShape('Fetching metadata'), 'progress');
  assert.equal(statusShape('Pending'), 'pending');
  assert.equal(statusShape('Import pending'), 'pending');
  assert.equal(statusShape('Stopped seeding'), 'done');
  assert.equal(statusShape('Import blocked'), 'attention');
  assert.equal(statusShape('Attention'), 'attention');
  assert.equal(statusShape('Failed'), 'failed');
  assert.equal(statusShape('Not configured'), 'pending');
  assert.equal(statusShape(undefined), 'failed');
});

test('dayGroupLabel names today and yesterday, then the date', () => {
  const now = new Date(2026, 9, 7, 18, 0);
  assert.equal(dayGroupLabel(new Date(2026, 9, 7, 1, 0).toISOString(), now), 'Today');
  assert.equal(dayGroupLabel(new Date(2026, 9, 6, 23, 0).toISOString(), now), 'Yesterday');
  assert.equal(dayGroupLabel(new Date(2026, 9, 2, 12, 0).toISOString(), now), 'Friday 2 October');
  assert.equal(dayGroupLabel(new Date(2025, 11, 24).toISOString(), now), '24 December 2025');
  assert.equal(dayGroupLabel(undefined, now), 'Earlier');
});

test('formatClock shows only the time of day', () => {
  assert.equal(formatClock(new Date(2026, 2, 3, 9, 5).toISOString()), '09:05');
  assert.equal(formatClock(undefined), '');
});
