import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// A mode is only safe to switch to when someone can still get in afterwards; otherwise saving it locks everyone out.
export function authModeProblem({ mode, apiKey = '', username = '', password = '', passwordHash = '' }) {
  if (mode === 'none') return '';
  if (mode === 'apikey') return apiKey ? '' : 'Set an API key before requiring one, or nobody can sign in.';
  if (mode === 'basic') return username && (password || passwordHash) ? '' : 'Basic authentication needs a username and password. No password is set, so nobody could sign in.';
  return `Unknown authentication mode "${mode}".`;
}

// Passwords set from Settings are stored as salted scrypt hashes, never as plain text in config.json.
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

export function verifyPassword(password, stored = '') {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

function sameText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

// A plaintext password (AUTH_PASSWORD or a hand-edited config) wins over a stored hash.
export function basicCredentialsValid(authorization, auth) {
  const value = String(authorization || '');
  if (!value.startsWith('Basic ')) return false;
  const decoded = Buffer.from(value.slice(6), 'base64').toString();
  const separator = decoded.indexOf(':');
  if (separator < 0 || !auth.username || !sameText(decoded.slice(0, separator), auth.username)) return false;
  const password = decoded.slice(separator + 1);
  if (auth.password) return sameText(password, auth.password);
  return Boolean(password) && verifyPassword(password, auth.passwordHash);
}

// Blank fields keep the current value, so Settings never has to show or resend a secret.
export function mergeAuthUpdate(current = {}, update = {}) {
  const next = { ...current, mode: update.mode || current.mode || 'none' };
  if (update.apiKey) next.apiKey = update.apiKey;
  if (update.username) next.username = update.username;
  if (update.password) {
    next.passwordHash = hashPassword(update.password);
    delete next.password;
  }
  return next;
}

// One answer to "is this request signed in?", shared by the API guard and /api/auth/status so they never disagree.
export function credentialsAccepted(auth, { authorization = '', apiKeyHeader, hasSession = false } = {}) {
  if (auth.mode === 'none') return true;
  if (auth.mode === 'basic') return hasSession || basicCredentialsValid(authorization, auth);
  if (auth.mode === 'apikey') return Boolean(auth.apiKey) && (hasSession || (apiKeyHeader !== undefined && sameText(apiKeyHeader, auth.apiKey)));
  return false;
}
