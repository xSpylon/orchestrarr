import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function reply(response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
}

async function startMockServices({ failPaths = [], invalidJsonPaths = [] } = {}) {
  const requests = [];
  const failedPaths = new Set(failPaths);
  const malformedPaths = new Set(invalidJsonPaths);
  const server = createServer(async (request, response) => {
    const body = await readRequestBody(request);
    let parsedBody = null;
    try { parsedBody = body ? JSON.parse(body) : null; } catch { parsedBody = body; }
    const url = new URL(request.url, 'http://127.0.0.1');
    requests.push({ method: request.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body: parsedBody, headers: request.headers });
    if (failedPaths.has(url.pathname)) return reply(response, 503, { error: 'synthetic upstream failure' });
    if (malformedPaths.has(url.pathname)) return reply(response, 200, 'not-json', { 'Content-Type': 'application/json' });

    if (url.pathname === '/hubs/search') {
      response.writeHead(200, { 'Content-Type': 'application/xml' });
      response.end('<MediaContainer><Video type="movie" title="Movie" ratingKey="42" librarySectionTitle="Films"><Guid id="tmdb://123" /></Video></MediaContainer>');
      return;
    }
    if (url.pathname === '/identity') {
      response.writeHead(200, { 'Content-Type': 'application/xml' });
      response.end('<MediaContainer machineIdentifier="machine-123" />');
      return;
    }
    if (url.pathname === '/status/sessions') {
      response.writeHead(200, { 'Content-Type': 'application/xml' });
      response.end('<MediaContainer />');
      return;
    }
    if (url.pathname === '/api/v3/movie') return reply(response, 200, [{ id: 7, tmdbId: 123, title: 'Movie', hasFile: true }]);
    if (url.pathname === '/api/v3/series') return reply(response, 200, [{ id: 8, tmdbId: 321, title: 'Series', seasons: [] }]);
    if (url.pathname === '/api/v3/queue') {
      if (url.searchParams.get('pageSize') === '200') return reply(response, 200, { records: [{ id: 77, status: 'completed', trackedDownloadStatus: 'warning', trackedDownloadState: 'importPending', downloadId: 'download-77', movieId: 7, protocol: 'usenet' }] });
      return reply(response, 200, { records: [] });
    }
    if (url.pathname === '/api/v3/wanted/missing') return reply(response, 200, { records: [] });
    if (url.pathname === '/api/v3/command' && request.method === 'POST') return reply(response, 201, { id: 90, status: 'queued' });
    if (url.pathname === '/api/v3/command/90') return reply(response, 200, { status: 'completed' });
    if (url.pathname === '/api/v3/manualimport') return reply(response, 200, [{ path: '/downloads/Movie.mkv', movie: { id: 7 }, quality: {}, languages: [], releaseGroup: 'test' }]);
    if (url.pathname.startsWith('/api/v3/queue/') && request.method === 'DELETE') return reply(response, 200, {});

    if (url.pathname === '/api/v1/request' && request.method === 'GET') return reply(response, 200, { results: [], pageInfo: { results: 0 } });
    if (url.pathname === '/api/v1/request' && request.method === 'POST') return reply(response, 201, { id: 88, status: 'PENDING' });
    if (/^\/api\/v1\/request\/\d+\/(approve|decline)$/.test(url.pathname)) return reply(response, 200, {});
    if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') { response.writeHead(204); response.end(); return; }
    if (url.pathname === '/api/v1/indexer') return reply(response, 200, [{ enable: true }, { enable: false }]);
    if (url.pathname === '/api/v1/health') return reply(response, 200, []);
    if (url.pathname === '/api/health') return reply(response, 200, { status: 'healthy' });
    if (url.pathname === '/api/invitations') return reply(response, 200, { invitations: [{ used: false }, { used: true }] });
    if (url.pathname === '/api/users') return reply(response, 200, { users: [{ id: 1 }] });
    if (url.pathname === '/api/badges') return reply(response, 200, { episodes: 2, movies: 1, providers: 0, status: 0 });
    if (url.pathname === '/api/v2/stats') return reply(response, 200, { events: { totalCount: 3, timeframeHours: 24 }, strikes: { totalCount: 1, itemsRemoved: 1 }, jobs: { byType: {} } });
    if (url.pathname === '/api/v2/status') return reply(response, 200, { status: 'good', version: '2.85.01' });
    if (url.pathname === '/api/v2/get-nodes') return reply(response, 200, { nodes: [{ id: 1 }, { id: 2 }] });
    if (url.pathname === '/api/v2/cruddb') return reply(response, 200, { data: { table1ViewableCount: 3, table3ViewableCount: 0 } });
    if (url.pathname === '/api/v2/auth/login' && request.method === 'POST') return reply(response, 200, 'Ok.', { 'Set-Cookie': 'SID=synthetic; Path=/' });
    if (url.pathname === '/api/v2/torrents/info') return reply(response, 200, [{ name: 'Download', state: 'stalledDL', progress: 0.42, hash: 'abc123' }]);
    if (url.pathname === '/api/v2/torrents/start' || url.pathname === '/api/v2/torrents/stop') return reply(response, 200, 'Ok.');
    if (url.pathname === '/api/v2') return reply(response, 200, { response: { data: { sessions: [] } } });
    if (url.pathname === '/api' && url.searchParams.get('mode') === 'queue') return reply(response, 200, { queue: { slots: [] } });
    if (url.pathname === '/graphql') return reply(response, 200, { data: { info: { os: { uptime: 3600 } }, array: { state: 'STARTED', capacity: { kilobytes: { free: 10, used: 20, total: 30 } }, disks: [] } } });
    if (url.pathname === '/notify') return reply(response, 200, {});

    reply(response, 404, { error: `Unhandled mock route ${request.method} ${url.pathname}` });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return { url: `http://127.0.0.1:${address.port}`, requests, stop: () => new Promise((resolve) => server.close(resolve)) };
}

async function startOrchestrarr(directory, configPath, extraEnv = {}) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url),
    env: { PATH: process.env.PATH, PORT: '0', HOST: '127.0.0.1', AUTH_MODE: 'none', DEMO_MODE: 'false', CONFIG_PATH: configPath, STATE_DIR: join(directory, 'state'), ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); });
  };
  try {
    const url = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Test server startup timed out')), 5000);
      let errors = '';
      child.stderr.on('data', (chunk) => { errors += chunk; });
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Test server exited (${code}): ${errors}`)); });
      child.stdout.on('data', (chunk) => {
        const match = chunk.toString().match(/Orchestrarr listening on (http:\/\/[^\s]+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
    });
    return { url, stop };
  } catch (error) { await stop(); throw error; }
}

async function responseJson(response) {
  return response.json();
}

test('live HTTP routes exercise service adapters, actions, webhooks and notifications', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-routes-'));
  const mock = await startMockServices();
  const configPath = join(directory, 'config.json');
  const service = (extra = {}) => ({ url: mock.url, apiKey: 'synthetic-key', ...extra });
  writeFileSync(configPath, JSON.stringify({
    demoMode: false,
    plex: { url: mock.url, token: 'plex-token' },
    sonarr: service(),
    radarr: service(),
    tautulli: { url: mock.url, apiKey: 'tautulli-key' },
    jellyseerr: service(),
    wizarr: service({ publicUrl: mock.url }),
    cleanuparr: service(),
    tdarr: service(),
    prowlarr: service(),
    bazarr: service(),
    qbittorrent: { url: mock.url, username: 'admin', password: 'password' },
    sabnzbd: service(),
    unraid: service(),
    notifications: { webhookUrl: `${mock.url}/notify` },
    docker: { enabled: false },
    auth: { mode: 'none' },
  }));
  let app;
  try {
    app = await startOrchestrarr(directory, configPath);

    const plex = await fetch(`${app.url}/api/plex/library-match?type=movie&tmdbId=123&title=Movie`);
    assert.deepEqual(await responseJson(plex), { status: 'found', library: 'Films', ratingKey: '42', webUrl: 'https://app.plex.tv/desktop/#!/server/machine-123/details?key=%2Flibrary%2Fmetadata%2F42' });

    const arr = await fetch(`${app.url}/api/arr/media-match?type=movie&tmdbId=123&title=Movie`);
    assert.deepEqual(await responseJson(arr), { status: 'available', detail: 'Movie file in Radarr', id: 7 });

    const search = await fetch(`${app.url}/api/actions/search-arr?service=Radarr&id=7`, { method: 'POST' });
    assert.deepEqual(await responseJson(search), { ok: true, action: 'search', service: 'Radarr', id: 7 });

    const episodeSearch = await fetch(`${app.url}/api/actions/search-sonarr-availability?seriesId=8&scope=episode&episodeId=9`, { method: 'POST' });
    assert.deepEqual(await responseJson(episodeSearch), { ok: true, scope: 'episode', command: 'EpisodeSearch' });
    const seasonSearch = await fetch(`${app.url}/api/actions/search-sonarr-availability?seriesId=8&scope=season&seasonNumber=1`, { method: 'POST' });
    assert.deepEqual(await responseJson(seasonSearch), { ok: true, scope: 'season', command: 'SeasonSearch' });

    const request = await fetch(`${app.url}/api/actions/request-jellyseerr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaType: 'tv', tmdbId: 321 }) });
    assert.deepEqual(await responseJson(request), { ok: true, requestId: 88, status: 'PENDING' });
    const approval = await fetch(`${app.url}/api/actions/jellyseerr-request?id=88&action=approve`, { method: 'POST' });
    assert.deepEqual(await responseJson(approval), { ok: true, requestId: '88', action: 'approve' });

    const blocklist = await fetch(`${app.url}/api/actions/blocklist-arr?service=Radarr&id=77`, { method: 'POST' });
    assert.deepEqual(await responseJson(blocklist), { ok: true, action: 'blocklist', service: 'Radarr', queueId: 77 });
    const imported = await fetch(`${app.url}/api/actions/import-arr?service=Radarr&id=77`, { method: 'POST' });
    assert.deepEqual(await responseJson(imported), { ok: true, service: 'Radarr', imported: 1, removedFromClient: false });
    const torrent = await fetch(`${app.url}/api/actions/resume-qbittorrent?hash=abc123`, { method: 'POST' });
    assert.deepEqual(await responseJson(torrent), { ok: true, action: 'resume', hash: 'abc123' });

    const serviceNames = ['Plex', 'Tautulli', 'Jellyseerr', 'Wizarr', 'Cleanuparr', 'Tdarr', 'Prowlarr', 'Bazarr', 'Sonarr', 'Radarr', 'qBittorrent', 'SABnzbd', 'Unraid'];
    for (const name of serviceNames) {
      const result = await fetch(`${app.url}/api/test-service?name=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(result.status, 200, `${name} adapter should respond successfully`);
      assert.equal((await responseJson(result)).ok, true);
    }

    const removed = await fetch(`${app.url}/api/wizarr/users/1`, { method: 'DELETE' });
    assert.equal(removed.status, 200);
    assert.equal(await responseJson(removed), null);
    const dockerAction = await fetch(`${app.url}/api/docker/start?container=orchestrarr`, { method: 'POST' });
    assert.equal(dockerAction.status, 500);
    assert.equal((await responseJson(dockerAction)).error, 'Docker is not enabled');
    const dockerLogs = await fetch(`${app.url}/api/docker/logs?container=orchestrarr`, { method: 'GET' });
    assert.equal(dockerLogs.status, 500);
    assert.equal((await responseJson(dockerLogs)).error, 'Docker is not enabled');

    const notification = await fetch(`${app.url}/api/notifications/test`, { method: 'POST' });
    assert.deepEqual(await responseJson(notification), { ok: true });
    const webhook = await fetch(`${app.url}/api/webhooks/sonarr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'Test', series: { tmdbId: 321, title: 'Series' } }) });
    assert.deepEqual(await responseJson(webhook), { ok: true, service: 'sonarr', title: 'Series', eventType: 'Test' });
    const resolved = await fetch(`${app.url}/api/actions/resolve?id=alert-1`, { method: 'POST' });
    assert.deepEqual(await responseJson(resolved), { ok: true, id: 'alert-1', action: 'resolved' });

    const commandBodies = mock.requests.filter((request) => request.path === '/api/v3/command').map((request) => request.body);
    assert.ok(commandBodies.some((body) => body?.name === 'MoviesSearch' && body.movieIds[0] === 7));
    assert.ok(commandBodies.some((body) => body?.name === 'EpisodeSearch' && body.episodeIds[0] === 9));
    assert.ok(mock.requests.some((request) => request.path === '/notify' && request.body?.event?.type === 'test'));
    const plexRequest = mock.requests.find((request) => request.path === '/status/sessions');
    assert.equal(plexRequest.query['X-Plex-Token'], 'plex-token');
    assert.equal(plexRequest.headers.accept, 'application/xml');
    const jellyseerrRequest = mock.requests.find((request) => request.path === '/api/v1/request' && request.method === 'GET');
    assert.equal(jellyseerrRequest.headers['x-api-key'], 'synthetic-key');
    const sonarrQueue = mock.requests.find((request) => request.path === '/api/v3/queue' && request.query.pageSize === '100');
    assert.equal(sonarrQueue.query.apiKey, 'synthetic-key');
    const qBittorrentLogin = mock.requests.find((request) => request.path === '/api/v2/auth/login');
    assert.match(qBittorrentLogin.body, /username=admin/);
    const qBittorrentInfo = mock.requests.find((request) => request.path === '/api/v2/torrents/info');
    assert.equal(qBittorrentInfo.headers.cookie, 'SID=synthetic; Path=/');
  } finally {
    await app?.stop();
    await mock.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('dashboard isolates failed and malformed upstream responses', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-failures-'));
  const mock = await startMockServices({ failPaths: ['/status/sessions', '/api/v3/queue'], invalidJsonPaths: ['/api/v1/request'] });
  const configPath = join(directory, 'config.json');
  const service = (extra = {}) => ({ url: mock.url, apiKey: 'synthetic-key', ...extra });
  writeFileSync(configPath, JSON.stringify({
    demoMode: false,
    plex: { url: mock.url, token: 'plex-token' },
    tautulli: { url: mock.url, apiKey: 'tautulli-key' },
    jellyseerr: service(),
    sonarr: service(),
    unraid: { url: 'not-a-url' },
    auth: { mode: 'none' },
  }));
  let app;
  try {
    app = await startOrchestrarr(directory, configPath);
    const response = await fetch(`${app.url}/api/dashboard`);
    assert.equal(response.status, 200);
    const dashboard = await response.json();
    expectServiceState(dashboard.services, 'Plex', 'Offline');
    expectServiceState(dashboard.services, 'Jellyseerr', 'Offline');
    expectServiceState(dashboard.services, 'Sonarr', 'Offline');
    assert.ok(dashboard.services.some((serviceStatus) => serviceStatus.name === 'Plex library' && serviceStatus.state === 'Attention'));
    assert.ok(dashboard.runtime.host);
  } finally {
    await app?.stop();
    await mock.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

function expectServiceState(services, name, state) {
  assert.equal(services.find((service) => service.name === name)?.state, state, `${name} should report ${state}`);
}

test('Docker routes validate names and execute through the configured CLI', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-docker-'));
  const bin = join(directory, 'bin');
  const docker = join(bin, 'docker');
  const configPath = join(directory, 'config.json');
  writeFileSync(configPath, JSON.stringify({ demoMode: false, docker: { enabled: true }, auth: { mode: 'none' } }));
  mkdirSync(bin, { recursive: true });
  writeFileSync(docker, '#!/bin/sh\ncase "$1" in\n  ps) printf \'{"ID":"abc","Names":"orchestrarr","Image":"orchestrarr:dev","State":"running","Status":"Up"}\\n\' ;;\n  logs) printf \'ready\\n\' ;;\n  *) exit 0 ;;\nesac\n');
  chmodSync(docker, 0o755);
  let app;
  try {
    app = await startOrchestrarr(directory, configPath, { PATH: `${bin}:${process.env.PATH}` });
    const logs = await fetch(`${app.url}/api/docker/logs?container=orchestrarr`);
    assert.deepEqual(await responseJson(logs), { ok: true, container: 'orchestrarr', logs: 'ready\n' });
    const restart = await fetch(`${app.url}/api/docker/restart?container=orchestrarr`, { method: 'POST' });
    assert.deepEqual(await responseJson(restart), { ok: true, action: 'restart', container: 'orchestrarr' });
    const invalid = await fetch(`${app.url}/api/docker/start?container=not/allowed`, { method: 'POST' });
    assert.equal(invalid.status, 500);
    assert.equal((await responseJson(invalid)).error, 'Invalid Docker container name');
  } finally {
    await app?.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('protected deployments authenticate webhooks with their dedicated secret', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-webhooks-'));
  const configPath = join(directory, 'config.json');
  writeFileSync(configPath, JSON.stringify({ demoMode: true, auth: { mode: 'apikey' } }));
  let app;
  try {
    app = await startOrchestrarr(directory, configPath, { AUTH_MODE: 'apikey', ORCHESTRARR_API_KEY: 'dashboard-key', ORCHESTRARR_WEBHOOK_SECRET: 'webhook-key' });
    const payload = JSON.stringify({ eventType: 'Test', title: 'Protected event' });
    assert.equal((await fetch(`${app.url}/api/webhooks/sonarr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })).status, 401);
    assert.equal((await fetch(`${app.url}/api/webhooks/sonarr`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Orchestrarr-Webhook-Secret': 'wrong' }, body: payload })).status, 401);
    const acceptedByHeader = await fetch(`${app.url}/api/webhooks/sonarr`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Orchestrarr-Webhook-Secret': 'webhook-key' }, body: payload });
    assert.equal(acceptedByHeader.status, 202);
    const acceptedByQuery = await fetch(`${app.url}/api/webhooks/radarr?secret=webhook-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
    assert.equal(acceptedByQuery.status, 202);
    assert.equal((await fetch(`${app.url}/api/dashboard`)).status, 401, 'webhook auth must not make the dashboard public');
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});
