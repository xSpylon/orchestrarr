import test from 'node:test';
import assert from 'node:assert/strict';
import { controlTorrent } from '../server/qbittorrent.js';

const fakeQbittorrent = (existing) => {
  const calls = [];
  const post = async (path) => { calls.push(path); return { ok: existing.includes(path), status: existing.includes(path) ? 200 : 404 }; };
  return { post, calls };
};

test('qBittorrent 5 uses torrents/stop and torrents/start', async () => {
  const v5 = fakeQbittorrent(['torrents/stop', 'torrents/start']);
  await controlTorrent(v5.post, 'pause', 'abc');
  await controlTorrent(v5.post, 'resume', 'abc');
  assert.deepEqual(v5.calls, ['torrents/stop', 'torrents/start']);
});

test('qBittorrent 4 uses the pause/resume fallback after a 404', async () => {
  const v4 = fakeQbittorrent(['torrents/pause', 'torrents/resume']);
  await controlTorrent(v4.post, 'pause', 'abc');
  assert.deepEqual(v4.calls, ['torrents/stop', 'torrents/pause']);
});

test('any other failure is reported, not retried', async () => {
  const broken = { post: async () => ({ ok: false, status: 403 }) };
  await assert.rejects(controlTorrent(broken.post, 'pause', 'abc'), /403/);
});
