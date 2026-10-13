import test from 'node:test';
import assert from 'node:assert/strict';
import { agendaDays, dateKey, monthCells } from '../src/helpers/calendar.ts';

test('dateKey pads month and day', () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('monthCells starts the grid on the Monday before the 1st and spans six weeks', () => {
  const cells = monthCells(2026, 9);
  assert.equal(cells.length, 42);
  assert.equal(dateKey(cells[0]), '2026-09-28');
  assert.equal(dateKey(cells[3]), '2026-10-01');
});

test('agendaDays groups entries by day in date order and skips undated ones', () => {
  const days = agendaDays([
    { title: 'B', date: '2026-10-09T20:00:00Z' },
    { title: 'A', date: '2026-10-02' },
    { title: 'C', date: '2026-10-09' },
    { title: 'X', date: 'soon' },
  ]);
  assert.deepEqual(days.map(([day, entries]) => [day, entries.map((entry) => entry.title)]), [['2026-10-02', ['A']], ['2026-10-09', ['B', 'C']]]);
});
