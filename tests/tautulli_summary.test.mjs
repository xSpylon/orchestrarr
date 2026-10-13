import test from 'node:test';
import assert from 'node:assert/strict';
import { historyAfterDate, summarizeWatchHistory } from '../server/tautulli_summary.js';

test('historyAfterDate gives the YYYY-MM-DD day the window starts', () => {
  assert.equal(historyAfterDate(30, new Date(2026, 9, 9, 12)), '2026-09-09');
  assert.equal(historyAfterDate(7, new Date(2026, 0, 3, 1)), '2025-12-27');
});

test('summarizeWatchHistory counts plays, users and minutes over the window', () => {
  const data = { recordsFiltered: 3, data: [{ user: 'sven', duration: 3600 }, { friendly_name: 'romy', play_duration: 1800 }, { user: 'sven', duration: 90 }] };
  assert.deepEqual(summarizeWatchHistory(data, 30), { plays: 3, users: 2, totalMinutes: 92, periodDays: 30 });
});

test('summarizeWatchHistory trusts the filtered total when Tautulli pages the rows', () => {
  const data = { recordsFiltered: 1500, data: [{ user: 'sven', duration: 600 }] };
  assert.equal(summarizeWatchHistory(data, 30).plays, 1500);
});

test('summarizeWatchHistory accepts a bare row array', () => {
  assert.deepEqual(summarizeWatchHistory([{ user: 'a', duration: 120 }], 30), { plays: 1, users: 1, totalMinutes: 2, periodDays: 30 });
});
