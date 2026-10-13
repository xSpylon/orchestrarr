import test from 'node:test';
import assert from 'node:assert/strict';
import { shortcutDestination, navigationShortcuts, navigationPaths, focusFromPath, focusPath } from '../src/lib/navigation.ts';

test('g followed by a letter resolves to a destination path', () => {
  assert.equal(shortcutDestination('g', 'r'), '/requests');
  assert.equal(shortcutDestination('g', 'O'), '/');
  assert.equal(shortcutDestination('g', 'b'), '/about');
});

test('keys without a g prefix or unknown letters resolve to nothing', () => {
  assert.equal(shortcutDestination('', 'r'), undefined);
  assert.equal(shortcutDestination('g', 'z'), undefined);
});

test('every navigation destination has a unique shortcut', () => {
  const keys = Object.keys(navigationPaths);
  assert.deepEqual(Object.keys(navigationShortcuts).sort(), keys.sort());
  assert.equal(new Set(Object.values(navigationShortcuts)).size, keys.length);
});

test('title focus round-trips through the path for seasons and episodes', () => {
  assert.deepEqual(focusFromPath('s0'), { kind: 'season', seasonNumber: 0 });
  assert.deepEqual(focusFromPath('S2E7'), { kind: 'episode', seasonNumber: 2, episodeNumber: 7 });
  assert.equal(focusFromPath('e7'), undefined);
  assert.equal(focusFromPath(''), undefined);
  assert.equal(focusPath({ kind: 'season', seasonNumber: 0 }), '/s0');
  assert.equal(focusPath({ kind: 'episode', seasonNumber: 2, episodeNumber: 7 }), '/s2e7');
  assert.equal(focusPath({ kind: 'episode', episodeNumber: 7 }), '');
  assert.equal(focusPath(undefined), '');
});
