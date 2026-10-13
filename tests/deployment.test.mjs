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
