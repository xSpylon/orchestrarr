import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function startServer(directory, key, mode = 'apikey', extraEnv = {}) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url),
    env: { PATH: process.env.PATH, PORT: '0', HOST: '127.0.0.1', AUTH_MODE: mode, ...(key ? { ORCHESTRARR_API_KEY: key } : {}), DEMO_MODE: 'true', CONFIG_PATH: join(directory, 'nested', 'config.json'), STATE_DIR: join(directory, 'state'), ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (chunk) => { logs += chunk; });
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
    return { url, stop, logs: () => logs };
  } catch (error) { await stop(); throw error; }
}

test('API-key deployment without a key generates one, logs it once and keeps it across restarts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-deployment-'));
  let app;
  try {
    app = await startServer(directory, '');
    const key = app.logs().match(/API key: ([0-9a-f]{64})/)?.[1];
    assert.ok(key, `the generated key is logged on first start:\n${app.logs()}`);
    assert.equal(statSync(join(directory, 'state', 'api_key.json')).mode & 0o777, 0o600);
    assert.equal((await fetch(`${app.url}/api/auth/login`, { method: 'POST', body: JSON.stringify({ key }) })).status, 200);
    await app.stop();
    app = await startServer(directory, '');
    assert.ok(!app.logs().includes(key), 'the key is not printed again after the first start');
    assert.equal((await fetch(`${app.url}/api/auth/login`, { method: 'POST', body: JSON.stringify({ key }) })).status, 200);
  } finally {
    await app?.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('API-key deployment protects private files and preserves settings across restarts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-deployment-'));
  const key = 'synthetic-test-key';
  let app;
  try {
    app = await startServer(directory, key);
    assert.equal((await fetch(`${app.url}/api/config`)).status, 401);
    assert.equal((await fetch(`${app.url}/api/health`)).status, 200);
    assert.equal((await fetch(`${app.url}/config.json`)).status, 404);
    const denied = await fetch(`${app.url}/api/auth/login`, { method: 'POST', body: JSON.stringify({ key: 'wrong' }) });
    assert.equal(denied.status, 401);
    const login = await fetch(`${app.url}/api/auth/login`, { method: 'POST', body: JSON.stringify({ key }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const saved = await fetch(`${app.url}/api/config`, { method: 'PUT', headers: { Cookie: cookie, Origin: app.url, 'Content-Type': 'application/json' }, body: JSON.stringify({ sonarr: { url: 'http://sonarr.example', apiKey: 'synthetic-service-key' } }) });
    assert.equal(saved.status, 200);
    assert.equal(statSync(join(directory, 'nested', 'config.json')).mode & 0o777, 0o600);
    const authenticated = await (await fetch(`${app.url}/api/auth/status`, { headers: { Cookie: cookie } })).json();
    assert.deepEqual(authenticated, { mode: 'apikey', authenticated: true });
    const logout = await fetch(`${app.url}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie, Origin: app.url } });
    assert.equal(logout.status, 200);
    assert.deepEqual(await (await fetch(`${app.url}/api/auth/status`, { headers: { Cookie: cookie } })).json(), { mode: 'apikey', authenticated: false });
    await app.stop();
    app = await startServer(directory, key);
    const response = await fetch(`${app.url}/api/config`, { headers: { 'X-Orchestrarr-Key': key } });
    const text = await response.text();
    assert.equal(response.status, 200);
    assert.equal(JSON.parse(text).services.sonarr.url, 'http://sonarr.example');
    assert.doesNotMatch(text, /synthetic-service-key/);
    assert.equal((await fetch(`${app.url}/api/config`, { headers: { Cookie: cookie } })).status, 401, 'restart invalidates old sessions');
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('API-key mode without a configured key stays locked', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-locked-'));
  let app;
  try {
    app = await startServer(directory);
    assert.equal((await fetch(`${app.url}/api/config`)).status, 401);
    assert.equal((await fetch(`${app.url}/api/auth/login`, { method: 'POST', body: JSON.stringify({ key: '' }) })).status, 401);
    assert.equal((await fetch(`${app.url}/api/health`)).status, 200);
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('basic authentication protects API routes and reports its current state', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-basic-'));
  let app;
  try {
    app = await startServer(directory, '', 'basic', { AUTH_USERNAME: 'admin', AUTH_PASSWORD: 'correct horse' });
    assert.deepEqual(await (await fetch(`${app.url}/api/auth/status`)).json(), { mode: 'basic', authenticated: false });
    assert.equal((await fetch(`${app.url}/api/config`)).status, 401);
    const authorization = `Basic ${Buffer.from('admin:correct horse').toString('base64')}`;
    const config = await fetch(`${app.url}/api/config`, { headers: { Authorization: authorization } });
    assert.equal(config.status, 200);
    assert.doesNotMatch(await config.text(), /correct horse/);
    assert.deepEqual(await (await fetch(`${app.url}/api/auth/status`, { headers: { Authorization: authorization } })).json(), { mode: 'basic', authenticated: true });
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('authentication guards every private API family while leaving health and auth status public', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-auth-matrix-'));
  let app;
  try {
    app = await startServer(directory, 'matrix-key');
    for (const path of ['/api/dashboard', '/api/services', '/api/analytics', '/api/config']) {
      assert.equal((await fetch(`${app.url}${path}`)).status, 401, `${path} must require authentication`);
    }
    assert.equal((await fetch(`${app.url}/api/health`)).status, 200);
    assert.equal((await fetch(`${app.url}/api/auth/status`)).status, 200);
    assert.equal((await fetch(`${app.url}/api/config`, { method: 'OPTIONS', headers: { Origin: 'https://cross-site.example' } })).status, 204);
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('repeated invalid API-key logins are rate limited', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-auth-rate-'));
  let app;
  try {
    app = await startServer(directory, 'rate-key');
    const statuses = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      statuses.push((await fetch(`${app.url}/api/auth/login`, { method: 'POST', body: JSON.stringify({ key: 'wrong' }) })).status);
    }
    assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
    assert.equal(statuses[10], 429);
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('malformed login bodies and method mismatches are rejected safely', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-auth-malformed-'));
  let app;
  try {
    app = await startServer(directory, 'malformed-key');
    const malformed = await fetch(`${app.url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 500);
    assert.match((await malformed.json()).error, /Unexpected end|JSON/);
    assert.equal((await fetch(`${app.url}/api/auth/logout`)).status, 404);
    assert.equal((await fetch(`${app.url}/api/auth/status`, { method: 'POST' })).status, 405);
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('public demo stays in demo mode and refuses writes that change settings or reach other hosts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-public-demo-'));
  let app;
  try {
    // DEMO_MODE=false must not win: a public demo never shows live data
    app = await startServer(directory, '', 'none', { PUBLIC_DEMO: 'true', DEMO_MODE: 'false', DOCKER_ENABLED: 'true' });
    const write = (path, method = 'POST', body = {}) => fetch(`${app.url}${path}`, { method, headers: { Origin: app.url, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const dashboard = await (await fetch(`${app.url}/api/dashboard`)).json();
    assert.equal(dashboard.mode, 'demo');
    assert.equal(dashboard.publicDemo, true);
    assert.equal((await (await fetch(`${app.url}/api/config`)).json()).publicDemo, true);
    for (const [path, method, body] of [
      ['/api/config', 'PUT', { demoMode: false }],
      ['/api/config', 'PUT', { demoProfile: 'large' }],
      ['/api/test-service?name=sonarr', 'POST', { settings: { url: 'http://169.254.169.254', apiKey: 'x' } }],
      ['/api/notifications/test'],
      ['/api/docker/restart?container=orchestrarr'],
      ['/api/webhooks/sonarr'],
    ]) {
      const response = await write(path, method, body);
      assert.equal(response.status, 403, `${method || 'POST'} ${path}`);
      assert.match((await response.json()).error, /public demo/i);
    }
    assert.equal((await fetch(`${app.url}/api/docker/logs?container=orchestrarr`)).status, 403);
    // demo-only actions still work, so the demo feels like the app
    assert.equal((await write('/api/wizarr/invitations')).status, 201);
    assert.equal((await write('/api/refresh')).status, 200);
    assert.equal((await (await fetch(`${app.url}/api/config`)).json()).demoProfile, 'medium');
    // posters come from the local demo set only; the server never fetches TMDb images on a visitor's behalf
    assert.equal((await fetch(`${app.url}/api/discovery-artwork?path=/demo/posters/afterlight.png&size=w342`)).status, 200);
    assert.equal((await fetch(`${app.url}/api/discovery-artwork?path=/qJ2tW6WMUDux911r6m7haRef0WH.jpg&size=w342`)).status, 404);
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('demo actions change only the acting visitor\'s demo data, also in a public demo', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-demo-actions-'));
  let app;
  try {
    app = await startServer(directory, '', 'none', { PUBLIC_DEMO: 'true' });
    const visitor = async () => {
      const response = await fetch(`${app.url}/api/dashboard`);
      const cookie = response.headers.get('set-cookie')?.split(';')[0];
      assert.match(cookie || '', /^orchestrarr_demo=/);
      return { cookie, dashboard: await response.json() };
    };
    const a = await visitor();
    const b = await visitor();
    const post = (cookie, path, body) => fetch(`${app.url}${path}`, { method: 'POST', headers: { Cookie: cookie, Origin: app.url, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const dashboardOf = async (cookie) => (await fetch(`${app.url}/api/dashboard`, { headers: { Cookie: cookie } })).json();
    const pending = a.dashboard.requests.find((item) => item.state === 'Pending');
    const failedImport = a.dashboard.pipeline.find((item) => item.importAction);
    assert.equal((await post(a.cookie, `/api/actions/jellyseerr-request?id=${pending.requestId}&action=approve`)).status, 200);
    assert.equal((await post(a.cookie, `/api/actions/import-arr?service=${failedImport.service}&id=${failedImport.queueId}`)).status, 200);
    assert.equal((await post(a.cookie, '/api/actions/request-jellyseerr', { mediaType: 'movie', tmdbId: a.dashboard.requests[0].tmdbId })).status, 200);
    const afterA = await dashboardOf(a.cookie);
    assert.equal(afterA.requests.find((item) => item.requestId === pending.requestId).state, 'Approved');
    assert.equal(afterA.pipeline.find((item) => item.queueId === failedImport.queueId), undefined);
    assert.equal(afterA.requests[0].requester, 'You');
    const afterB = await dashboardOf(b.cookie);
    assert.equal(afterB.requests.find((item) => item.requestId === pending.requestId).state, 'Pending');
    assert.ok(afterB.pipeline.find((item) => item.queueId === failedImport.queueId));
    const bogus = await post(a.cookie, '/api/actions/jellyseerr-request?id=1&action=delete');
    assert.equal(bogus.status, 500);
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('live updates allow a few connections per visitor and refuse the rest', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-events-'));
  let app;
  const open = [];
  const connect = async (headers = {}) => {
    const controller = new AbortController();
    const response = await fetch(`${app.url}/api/events`, { headers, signal: controller.signal });
    open.push(controller);
    return response.status;
  };
  try {
    app = await startServer(directory, '', 'none', { TRUST_PROXY: 'true' });
    for (let index = 0; index < 5; index += 1) assert.equal(await connect({ 'CF-Connecting-IP': '203.0.113.7' }), 200);
    assert.equal(await connect({ 'CF-Connecting-IP': '203.0.113.7' }), 429, 'the sixth connection from one visitor is refused');
    assert.equal(await connect({ 'CF-Connecting-IP': '198.51.100.9' }), 200, 'another visitor behind the same proxy still gets in');
    open.shift().abort();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(await connect({ 'CF-Connecting-IP': '203.0.113.7' }), 200, 'a closed tab frees its slot');
  } finally { open.forEach((controller) => controller.abort()); await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('without TRUST_PROXY a forwarded address header is ignored', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-events-direct-'));
  let app;
  const open = [];
  try {
    app = await startServer(directory, '', 'none');
    const statuses = [];
    for (let index = 0; index < 6; index += 1) {
      const controller = new AbortController(); open.push(controller);
      statuses.push((await fetch(`${app.url}/api/events`, { headers: { 'CF-Connecting-IP': `203.0.113.${index}` }, signal: controller.signal })).status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429], 'spoofed headers do not buy extra connections');
  } finally { open.forEach((controller) => controller.abort()); await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});

test('basic sign-in also starts a session, so images load without an Authorization header', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'orchestrarr-basic-session-'));
  let app;
  try {
    app = await startServer(directory, '', 'basic', { AUTH_USERNAME: 'admin', AUTH_PASSWORD: 'correct horse' });
    const login = (body) => fetch(`${app.url}/api/auth/login`, { method: 'POST', headers: { Origin: app.url, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await login({ username: 'admin', password: 'wrong' })).status, 401);
    const response = await login({ username: 'admin', password: 'correct horse' });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    assert.match(cookie || '', /^orchestrarr_session=/);
    // an <img> sends cookies but never the Authorization header the app adds to fetch
    assert.notEqual((await fetch(`${app.url}/api/media/123/artwork`, { headers: { Cookie: cookie } })).status, 401);
    assert.deepEqual(await (await fetch(`${app.url}/api/auth/status`, { headers: { Cookie: cookie } })).json(), { mode: 'basic', authenticated: true });
  } finally { await app?.stop(); rmSync(directory, { recursive: true, force: true }); }
});
