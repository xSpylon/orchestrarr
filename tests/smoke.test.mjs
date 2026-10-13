import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let baseUrl;
let temporary;
let server;

before(async () => {
  temporary = mkdtempSync(join(tmpdir(), 'orchestrarr-smoke-'));
  writeFileSync(join(temporary, 'config.json'), JSON.stringify({ plex: { token: 'synthetic-private-token' } }));
  server = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url),
    // Never inherit the developer's live integrations or write their configuration/history.
    env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: '0', DEMO_MODE: 'true', AUTH_MODE: 'none', CONFIG_PATH: join(temporary, 'config.json'), STATE_DIR: join(temporary, 'state') },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start')), 5000);
    let stderr = '';
    server.stderr.on('data', (chunk) => { stderr += chunk; });
    const onData = (chunk) => {
      const match = chunk.toString().match(/Orchestrarr listening on (http:\/\/[^\s]+)/);
      if (match) {
        baseUrl = match[1];
        clearTimeout(timer);
        resolve();
      }
    };
    server.stdout.on('data', onData);
    server.once('error', (error) => { clearTimeout(timer); reject(error); });
    server.once('exit', (code) => { clearTimeout(timer); reject(new Error(`server exited before startup: ${code}\n${stderr}`)); });
  });
});

after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    await new Promise((resolve) => { server.once('exit', resolve); server.kill('SIGTERM'); });
  }
  if (temporary) rmSync(temporary, { recursive: true, force: true });
});

test('serves the application shell when built, otherwise reports that it is unavailable', async () => {
  const response = await fetch(`${baseUrl}/`);
  const built = existsSync(new URL('../dist/index.html', import.meta.url));
  assert.equal(response.status, built ? 200 : 503);
  if (built) assert.match(await response.text(), /Orchestrarr/);
});

test('reports health and safe configuration metadata', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const config = await fetch(`${baseUrl}/api/config`);
  assert.equal(config.status, 200);
  const payload = await config.json();
  assert.equal(payload.demoMode, true);
  assert.equal(payload.demoProfile, 'medium');
  assert.equal(typeof payload.services, 'object');
  assert.equal('apiKey' in payload, false);
  assert.equal('password' in payload, false);
});

test('returns a deterministic dashboard in demo mode', async () => {
  const response = await fetch(`${baseUrl}/api/dashboard`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(Array.isArray(payload.activity));
  assert.ok(Array.isArray(payload.alerts));
  assert.ok(Array.isArray(payload.services));
  assert.ok(payload.media.length >= 24);
  assert.ok(payload.allMedia.length >= 90);
  assert.ok(payload.requests.length >= 200);
  assert.ok(payload.analytics.history.length >= 700);
  assert.ok(payload.activity.length >= 90);
  assert.ok(new Set(payload.allMedia.map((item) => item.title)).size >= 90);
  assert.ok(new Set(payload.requests.map((item) => item.requester)).size >= 40);
  const libraryIds = new Set(payload.allMedia.map((item) => String(item.tmdbId)));
  assert.equal(payload.requests.filter((item) => ['Pending', 'Requested', 'Approved'].includes(item.state)).some((item) => libraryIds.has(String(item.tmdbId))), false);
  assert.equal(payload.requests.filter((item) => item.state === 'Available').every((item) => libraryIds.has(String(item.tmdbId))), true);
  assert.ok(new Set(payload.requests.filter((item) => ['Pending', 'Requested'].includes(item.state)).map((item) => String(item.tmdbId))).size >= 5);
  assert.ok(payload.requests.some((item) => String(item.tmdbId) === '900007' && item.state === 'Pending'));
  assert.equal(libraryIds.has('900007'), false);
});

test('serves a rich demo catalog and local artwork without external metadata', async () => {
  const discovery = await fetch(baseUrl + '/api/discovery');
  assert.equal(discovery.status, 200);
  const discoveryPayload = await discovery.json();
  assert.ok(discoveryPayload.results.length >= 6);
  assert.ok(discoveryPayload.total_pages >= 10);
  assert.match(discoveryPayload.results[0].poster, /^\/demo\/posters\/[a-z_]+\.png$/);
  const nextDiscoveryPage = await fetch(baseUrl + '/api/discovery?page=2');
  assert.equal(nextDiscoveryPage.status, 200);
  const nextDiscoveryPayload = await nextDiscoveryPage.json();
  assert.equal(nextDiscoveryPayload.page, 2);
  assert.notEqual(nextDiscoveryPayload.results[0].id, discoveryPayload.results[0].id);

  const detail = await fetch(baseUrl + '/api/discovery/detail?id=900001&type=movie');
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).poster_path, '/demo/posters/quiet_signal.png');

  const availability = await fetch(baseUrl + '/api/series/availability?tmdbId=900002&title=Glass%20Garden');
  assert.equal(availability.status, 200);
  const availabilityPayload = await availability.json();
  assert.ok(availabilityPayload.series.seasons.length >= 3);
  assert.ok(availabilityPayload.series.seasons[0].episodes.length >= 6);
  assert.notEqual(availabilityPayload.series.seasons[0].episodes[0].title, availabilityPayload.series.seasons[0].episodes[1].title);
  assert.notEqual(availabilityPayload.series.seasons[0].episodes[0].overview, availabilityPayload.series.seasons[0].episodes[1].overview);

  const pendingRequest = (await (await fetch(baseUrl + '/api/dashboard')).json()).requests.find((item) => String(item.tmdbId) === '900007' && item.state === 'Pending');
  const pendingPlex = await fetch(`${baseUrl}/api/plex/library-match?type=${pendingRequest.mediaType}&tmdbId=${pendingRequest.tmdbId}&title=${encodeURIComponent(pendingRequest.title)}`);
  assert.equal((await pendingPlex.json()).status, 'missing');

  const ratings = await fetch(baseUrl + '/api/ratings?tmdbId=900001&type=movie');
  assert.equal(ratings.status, 200);
  const ratingPayload = await ratings.json();
  assert.equal(typeof ratingPayload.rottenTomatoes.critics, 'number');
  assert.equal(typeof ratingPayload.imdb.score, 'number');
  assert.equal(typeof ratingPayload.metacritic.score, 'number');

  const management = await fetch(baseUrl + '/api/wizarr/management');
  assert.equal(management.status, 200);
  assert.ok((await management.json()).users.length >= 60);

  const calendar = await fetch(baseUrl + '/api/calendar');
  assert.equal(calendar.status, 200);
  assert.ok((await calendar.json()).entries.length >= 30);

  const artwork = await fetch(baseUrl + '/api/discovery-artwork?path=%2Fdemo%2Fposters%2Fquiet_signal.png&size=w342');
  assert.equal(artwork.status, 200);
  assert.equal(artwork.headers.get('content-type'), 'image/png');
  assert.ok((await artwork.arrayBuffer()).byteLength > 1000);
});

test('supports small, medium and large demo usage profiles', async () => {
  const save = (demoProfile) => fetch(`${baseUrl}/api/config`, { method: 'PUT', headers: { Origin: baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ demoProfile }) });
  const small = await save('small');
  assert.equal(small.status, 200);
  assert.equal((await small.json()).config.demoProfile, 'small');
  const smallDashboard = await (await fetch(`${baseUrl}/api/dashboard`)).json();
  assert.equal(smallDashboard.demoProfile, 'small');
  assert.equal(smallDashboard.allMedia.length, 24);
  assert.equal(smallDashboard.requests.length, 48);
  assert.equal(smallDashboard.requests.filter((item) => ['Pending', 'Requested'].includes(item.state)).length, 3);
  assert.equal(smallDashboard.analytics.history.length, 144);
  assert.equal((await (await fetch(`${baseUrl}/api/wizarr/management`)).json()).users.length, 12);

  const large = await save('large');
  assert.equal(large.status, 200);
  const largeDashboard = await (await fetch(`${baseUrl}/api/dashboard`)).json();
  assert.equal(largeDashboard.demoProfile, 'large');
  assert.equal(largeDashboard.requests.length, 480);
  assert.equal(largeDashboard.requests.filter((item) => ['Pending', 'Requested'].includes(item.state)).length, 12);
  assert.equal(largeDashboard.analytics.history.length, 1440);
  assert.equal(largeDashboard.streams.length, 18);
  assert.ok((await (await fetch(`${baseUrl}/api/calendar`)).json()).entries.length >= 90);

  const invalid = await save('unknown');
  assert.equal(invalid.status, 400);
  const legacy = await save('busy');
  assert.equal(legacy.status, 200);
  assert.equal((await legacy.json()).config.demoProfile, 'large');
  await save('medium');
  const mediumDashboard = await (await fetch(`${baseUrl}/api/dashboard`)).json();
  assert.equal(mediumDashboard.requests.filter((item) => ['Pending', 'Requested'].includes(item.state)).length, 6);
});

test('exposes analytics and calendar export routes', async () => {
  const analytics = await fetch(`${baseUrl}/api/analytics`);
  assert.equal(analytics.status, 200);
  assert.ok(Array.isArray((await analytics.json()).history));

  const calendar = await fetch(`${baseUrl}/api/calendar.ics`);
  assert.equal(calendar.status, 200);
  assert.match(await calendar.text(), /BEGIN:VCALENDAR/);
});

test('broadcasts webhook events over SSE', async () => {
  const stream = await fetch(`${baseUrl}/api/events`);
  assert.equal(stream.status, 200);
  const reader = stream.body.getReader();
  await fetch(`${baseUrl}/api/webhooks/sonarr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'smoke', title: 'SSE test' }) });
  let received = '';
  for (let attempt = 0; attempt < 3 && !received.includes('"type":"webhook"'); attempt += 1) received += new TextDecoder().decode((await reader.read()).value || new Uint8Array());
  await reader.cancel();
  assert.match(received, /"type":"webhook"/);
  assert.equal(statSync(join(temporary, 'state', 'request-events.json')).mode & 0o777, 0o600);
});

test('treats TMDb as a configurable service', async () => {
  const config = await (await fetch(`${baseUrl}/api/config`)).json();
  assert.equal(typeof config.services.tmdb?.configured, 'boolean');

  const response = await fetch(`${baseUrl}/api/test-service?name=TMDb`, { method: 'POST', body: JSON.stringify({ settings: { apiKey: '' } }) });
  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, 'Not configured');
});

test('discovery artwork only accepts known TMDb sizes', async () => {
  const response = await fetch(`${baseUrl}/api/discovery-artwork?path=/poster.jpg&size=original`);
  assert.equal(response.status, 400);
});

test('private paths never expose configuration or source over HTTP', async () => {
  for (const path of ['/config.json', '/.env', '/.git/config', '/server.js', '/.data/request-events.json']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(await response.text(), /synthetic-private-token/);
  }
  const config = await fetch(`${baseUrl}/api/config`);
  assert.doesNotMatch(await config.text(), /synthetic-private-token/);
  assert.equal(config.headers.get('access-control-allow-origin'), null);
});

test('configuration persists in the selected directory and rejects cross-site writes', async () => {
  const body = JSON.stringify({ notifications: { webhookUrl: 'https://example.com/test' } });
  const blocked = await fetch(`${baseUrl}/api/config`, { method: 'PUT', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body });
  assert.equal(blocked.status, 403);
  assert.equal(JSON.parse(readFileSync(join(temporary, 'config.json'), 'utf8')).notifications, undefined);
  const saved = await fetch(`${baseUrl}/api/config`, { method: 'PUT', headers: { Origin: baseUrl, 'Content-Type': 'application/json' }, body });
  assert.equal(saved.status, 200);
  assert.equal(JSON.parse(readFileSync(join(temporary, 'config.json'), 'utf8')).notifications.webhookUrl, 'https://example.com/test');
  assert.equal(statSync(join(temporary, 'config.json')).mode & 0o777, 0o600);

  const invalidUrl = await fetch(`${baseUrl}/api/config`, { method: 'PUT', headers: { Origin: baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ unraid: { url: 'not-a-url' } }) });
  assert.equal(invalidUrl.status, 400);
  assert.match((await invalidUrl.json()).error, /valid http/);

  const disabled = await fetch(`${baseUrl}/api/config`, { method: 'PUT', headers: { Origin: baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ demoMode: false }) });
  assert.equal(disabled.status, 200);
  assert.equal(JSON.parse(readFileSync(join(temporary, 'config.json'), 'utf8')).demoMode, false);
  const liveDashboard = await (await fetch(`${baseUrl}/api/dashboard`)).json();
  assert.equal(liveDashboard.mode, 'live');
  const expectedUnconfigured = ['Plex', 'Tautulli', 'Plex library', 'Jellyseerr', 'Wizarr', 'Cleanuparr', 'Tdarr', 'Prowlarr', 'Bazarr', 'Sonarr', 'Radarr', 'qBittorrent', 'SABnzbd', 'Unraid', 'TMDb', 'OMDb'];
  for (const name of expectedUnconfigured) {
    const service = liveDashboard.services.find((item) => item.name === name);
    assert.ok(service, `expected ${name} service status`);
    assert.equal(service.state, 'Not configured', name);
    assert.equal(service.detail, 'Add connection details', name);
  }

  const enabled = await fetch(`${baseUrl}/api/config`, { method: 'PUT', headers: { Origin: baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ demoMode: true }) });
  assert.equal(enabled.status, 200);
  assert.equal((await (await fetch(`${baseUrl}/api/dashboard`)).json()).mode, 'demo');
});
