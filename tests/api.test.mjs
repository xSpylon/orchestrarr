import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, apiUrl, encodeBasicCredentials, setAuthorizationHeader, setUnauthorizedHandler } from '../src/lib/api.ts';

test('apiUrl keeps same-origin API paths relative to the dashboard', () => {
  assert.equal(apiUrl('/api/dashboard'), '/api/dashboard');
});

test('encodeBasicCredentials uses UTF-8 before base64 encoding', () => {
  assert.equal(encodeBasicCredentials('sven', 'päss'), `Basic ${Buffer.from('sven:päss').toString('base64')}`);
});

test('apiRequest applies auth, JSON and cache headers while preserving caller headers', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  try {
    setAuthorizationHeader('Basic synthetic');
    globalThis.fetch = async (path, init) => {
      request = { path, init };
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    assert.deepEqual(await apiRequest('/api/config', { method: 'PUT', body: '{}', headers: { 'X-Test': 'yes' } }), { ok: true });
    assert.equal(request.path, '/api/config');
    assert.equal(request.init.cache, 'no-store');
    assert.equal(request.init.credentials, 'same-origin');
    assert.deepEqual(request.init.headers, { Authorization: 'Basic synthetic', 'Content-Type': 'application/json', 'X-Test': 'yes' });
  } finally {
    globalThis.fetch = originalFetch;
    setAuthorizationHeader('');
  }
});

test('apiRequest reports JSON errors and invokes the unauthorized handler for protected routes', async () => {
  const originalFetch = globalThis.fetch;
  let unauthorized = 0;
  try {
    setUnauthorizedHandler(() => { unauthorized += 1; });
    globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    await assert.rejects(apiRequest('/api/config'), /Authentication required/);
    await assert.rejects(apiRequest('/api/auth/status'), /Authentication required/);
    assert.equal(unauthorized, 1);
  } finally {
    globalThis.fetch = originalFetch;
    setUnauthorizedHandler(null);
  }
});

test('apiRequest falls back to the HTTP status for non-JSON errors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('upstream failed', { status: 502 });
    await assert.rejects(apiRequest('/api/dashboard'), /API 502/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
