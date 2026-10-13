import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOriginWriteAllowed } from '../server/request_security.js';

test('browser writes require the dashboard origin, including when authentication is disabled', () => {
  const allowed = (headers, method = 'POST') => sameOriginWriteAllowed({ method, headers: { host: 'localhost:4173', ...headers } });
  assert.equal(allowed({ origin: 'http://localhost:4173' }), true);
  assert.equal(allowed({ origin: 'https://localhost:4173' }), true);
  assert.equal(allowed({ origin: 'https://attacker.example' }), false);
  assert.equal(allowed({ origin: 'null' }), false);
  assert.equal(allowed({ referer: 'https://attacker.example/form' }), false);
  assert.equal(allowed({ 'sec-fetch-site': 'cross-site' }), false);
  assert.equal(allowed({}), true, 'non-browser API clients and webhooks remain supported');
  assert.equal(allowed({ origin: 'https://attacker.example' }, 'GET'), true, 'reads use browser same-origin policy, without CORS headers');
});
