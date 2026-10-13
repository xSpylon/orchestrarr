import test from 'node:test';
import assert from 'node:assert/strict';
import { displayText, formatMegabytes, formatMinutes, formatTime, mediaTypeLabel, pipelineStateLabel, statusTone } from '../src/helpers/format.ts';

const now = new Date(2026, 9, 7, 18, 0);

test('formatTime shows only the time for today', () => {
  assert.equal(formatTime(new Date(2026, 9, 7, 16, 37).toISOString(), now), '16:37');
});

test('formatTime shows day and month earlier this year', () => {
  assert.equal(formatTime(new Date(2026, 2, 3, 9, 5).toISOString(), now), '3 Mar');
});

test('formatTime adds the year for other years', () => {
  assert.equal(formatTime(new Date(2025, 11, 24).toISOString(), now), '24 Dec 2025');
});

test('formatTime accepts unix seconds and rejects missing values', () => {
  assert.equal(formatTime(new Date(2026, 9, 7, 8, 0).getTime() / 1000, now), '08:00');
  assert.equal(formatTime(undefined, now), 'Unavailable');
  assert.equal(formatTime('not a date', now), 'Unavailable');
});

test('formatMegabytes switches to GB from 1024 MB', () => {
  assert.equal(formatMegabytes(156), '156 MB');
  assert.equal(formatMegabytes(23814), '23.3 GB');
  assert.equal(formatMegabytes(undefined), 'Unavailable');
});

test('mediaTypeLabel reads the first word of the detail in sentence case', () => {
  assert.equal(mediaTypeLabel('series · 2025'), 'Series');
  assert.equal(mediaTypeLabel('MOVIE'), 'Movie');
  assert.equal(mediaTypeLabel(undefined), 'Media');
});

test('formatMinutes reads as hours and minutes', () => {
  assert.equal(formatMinutes(45), '45m');
  assert.equal(formatMinutes(2496), '41h 36m');
  assert.equal(formatMinutes(120), '2h');
  assert.equal(formatMinutes(undefined), 'Unavailable');
});

test('pipelineStateLabel translates raw qBittorrent states', () => {
  assert.equal(pipelineStateLabel('metaDL'), 'Fetching metadata');
  assert.equal(pipelineStateLabel('stoppedUP'), 'Stopped seeding');
  assert.equal(pipelineStateLabel('Import blocked'), 'Import blocked');
});

test('statusTone groups healthy, attention and unknown states', () => {
  assert.equal(statusTone('Healthy'), 'good');
  assert.equal(statusTone('Import blocked'), 'warn');
  assert.equal(statusTone('Unexpected state'), 'bad');
  assert.equal(statusTone(undefined), 'bad');
});

test('displayText decodes named and numeric XML entities but preserves invalid ones', () => {
  assert.equal(displayText('&amp; &quot; &#39; &#x1F600; &#65; &unknown; &#x110000;'), '& " \' 😀 A &unknown; &#x110000;');
});

test('formatBandwidth turns kbps into readable Mbps', async () => {
  const { formatBandwidth } = await import('../src/helpers/format.ts');
  assert.equal(formatBandwidth(18_400), '18.4 Mbps');
  assert.equal(formatBandwidth(120_000), '120 Mbps');
  assert.equal(formatBandwidth(850), '850 kbps');
  assert.equal(formatBandwidth(0), '0 Mbps');
});

test('formatVotes shortens large vote counts', async () => {
  const { formatVotes } = await import('../src/helpers/format.ts');
  assert.equal(formatVotes(1880), '1.9k');
  assert.equal(formatVotes(950), '950');
  assert.equal(formatVotes(21334), '21k');
  assert.equal(formatVotes(1_250_000), '1.3M');
});
