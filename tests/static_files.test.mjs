import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { serveStatic } from '../server/static_files.js';

test('static hosting isolates private files with and without a frontend build', () => {
  const root = mkdtempSync(join(tmpdir(), 'orchestrarr-static-'));
  const dist = join(root, 'dist');
  const request = (url, method = 'GET') => {
    const response = { status: 0, body: '', headers: {}, writeHead(status, headers) { this.status = status; this.headers = headers; }, end(body = '') { this.body = String(body); } };
    serveStatic({ url, method }, response, dist);
    return response;
  };
  try {
    writeFileSync(join(root, 'config.json'), '{"token":"synthetic-secret"}');
    writeFileSync(join(root, '.env'), 'SECRET=synthetic-secret');
    writeFileSync(join(root, 'server.js'), 'private server source');
    assert.equal(request('/').status, 503);
    for (const built of [false, true]) {
      if (built) {
        mkdirSync(join(dist, 'assets'), { recursive: true });
        mkdirSync(join(dist, 'licenses'));
        writeFileSync(join(dist, 'index.html'), '<html>Orchestrarr</html>');
        writeFileSync(join(dist, 'assets', 'app.js'), 'public script');
        writeFileSync(join(dist, 'licenses', 'reference_react.txt'), 'MIT License');
        mkdirSync(join(dist, 'demo', 'posters'), { recursive: true });
        writeFileSync(join(dist, 'demo', 'posters', 'quiet_signal.png'), 'demo poster');
        writeFileSync(join(dist, 'demo', 'posters', 'notes.js'), 'not a poster');
        // Even misplaced secrets and symlinks in dist must not be downloadable.
        writeFileSync(join(dist, 'config.json'), 'misplaced secret');
        symlinkSync(join(root, 'server.js'), join(dist, 'assets', 'escape.js'));
      }
      for (const url of ['/config.json', '/.env', '/.git/config', '/server.js', '/server/auth_config.js', '/.data/request-events.json', '/%2eenv', '/assets/../../config.json', '/assets/%2e%2e/config.json', '/assets/%2e%2e%2fconfig.json', '/assets/app.js.map']) {
        const result = request(url);
        assert.equal(result.status, 404, `${built ? 'built' : 'unbuilt'}: ${url}`);
        assert.doesNotMatch(result.body, /synthetic-secret|misplaced secret|private server/);
      }
    }
    assert.equal(request('/assets/escape.js').status, 404);
    assert.equal(request('/assets/app.js?v=1').body, 'public script');
    assert.equal(request('/licenses/reference_react.txt').body, 'MIT License');
    // Demo mode artwork is requested straight from /demo/posters, so it must load.
    assert.equal(request('/demo/posters/quiet_signal.png').body, 'demo poster');
    assert.equal(request('/demo/posters/quiet_signal.png').headers['Content-Type'], 'image/png');
    assert.equal(request('/demo/posters/notes.js').status, 404);
    assert.equal(request('/title/movie/123').body, '<html>Orchestrarr</html>');
    assert.equal(request('/assets/missing.js').status, 404);
    assert.equal(request('/%ZZ').status, 400);
    assert.equal(request('/', 'POST').status, 405);
    assert.equal(request('/', 'HEAD').body, '');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
