import test from 'node:test';
import assert from 'node:assert/strict';
import { authModeProblem } from '../server/auth_config.js';

test('trusted local network never locks anyone out', () => {
  assert.equal(authModeProblem({ mode: 'none' }), '');
});

test('basic auth without a password is refused, because nobody could sign in', () => {
  assert.match(authModeProblem({ mode: 'basic', username: 'admin', password: '' }), /password/i);
  assert.equal(authModeProblem({ mode: 'basic', username: 'admin', password: 'secret' }), '');
});

test('API key mode needs a key', () => {
  assert.match(authModeProblem({ mode: 'apikey', apiKey: '' }), /API key/);
  assert.equal(authModeProblem({ mode: 'apikey', apiKey: 'k' }), '');
});

test('an unknown mode is refused', () => {
  assert.match(authModeProblem({ mode: 'magic' }), /Unknown/);
});

test('a password set from the UI is stored as a hash and still verifies', async () => {
  const { mergeAuthUpdate, verifyPassword } = await import('../server/auth_config.js');
  const auth = mergeAuthUpdate({ mode: 'none', password: 'old-plain' }, { mode: 'basic', username: 'sven', password: 'correct horse' });
  assert.equal(auth.mode, 'basic');
  assert.equal(auth.username, 'sven');
  assert.equal(auth.password, undefined);
  assert.doesNotMatch(auth.passwordHash, /correct horse/);
  assert.equal(verifyPassword('correct horse', auth.passwordHash), true);
  assert.equal(verifyPassword('wrong', auth.passwordHash), false);
});

test('mergeAuthUpdate keeps existing secrets when fields are left blank', async () => {
  const { mergeAuthUpdate } = await import('../server/auth_config.js');
  const auth = mergeAuthUpdate({ mode: 'apikey', apiKey: 'keep-me', passwordHash: 'scrypt:a:b', username: 'admin' }, { mode: 'basic', apiKey: '', password: '' });
  assert.deepEqual(auth, { mode: 'basic', apiKey: 'keep-me', passwordHash: 'scrypt:a:b', username: 'admin' });
});

test('basic auth accepts a stored hash or a plaintext env password, and rejects the rest', async () => {
  const { basicCredentialsValid, hashPassword } = await import('../server/auth_config.js');
  const header = (user, pass) => `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  const hashed = { username: 'sven', passwordHash: hashPassword('pw') };
  assert.equal(basicCredentialsValid(header('sven', 'pw'), hashed), true);
  assert.equal(basicCredentialsValid(header('sven', 'nope'), hashed), false);
  assert.equal(basicCredentialsValid(header('other', 'pw'), hashed), false);
  assert.equal(basicCredentialsValid(header('sven', 'env-pw'), { username: 'sven', password: 'env-pw' }), true);
  assert.equal(basicCredentialsValid('', hashed), false);
  assert.equal(basicCredentialsValid(header('sven', ''), { username: 'sven' }), false);
});

test('a stored password hash counts as a password for basic mode', async () => {
  const { authModeProblem } = await import('../server/auth_config.js');
  assert.equal(authModeProblem({ mode: 'basic', username: 'admin', passwordHash: 'scrypt:a:b' }), '');
});

test('credentialsAccepted judges every mode from the request itself', async () => {
  const { credentialsAccepted, hashPassword } = await import('../server/auth_config.js');
  const basic = { mode: 'basic', username: 'admin', passwordHash: hashPassword('pw') };
  assert.equal(credentialsAccepted(basic, {}), false, 'basic without credentials must not count as signed in');
  assert.equal(credentialsAccepted(basic, { authorization: `Basic ${Buffer.from('admin:pw').toString('base64')}` }), true);
  assert.equal(credentialsAccepted({ mode: 'none' }, {}), true);
  assert.equal(credentialsAccepted({ mode: 'apikey', apiKey: 'k' }, { apiKeyHeader: 'k' }), true);
  assert.equal(credentialsAccepted({ mode: 'apikey', apiKey: 'k' }, { hasSession: true }), true);
  assert.equal(credentialsAccepted({ mode: 'apikey', apiKey: '' }, { apiKeyHeader: '' }), false);
  // Unsupported authentication modes fail closed.
  assert.equal(credentialsAccepted({ mode: 'unsupported' }, { authorization: '', apiKeyHeader: 'x' }), false);
});
