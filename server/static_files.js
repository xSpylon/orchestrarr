import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

// The repository is never a document root, even before the first build.
export function serveStatic(request, response, clientRoot) {
  const reply = (status, message) => {
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? '' : message);
  };
  if (!['GET', 'HEAD'].includes(request.method)) return reply(405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent((request.url || '/').split('?')[0]); }
  catch { return reply(400, 'Invalid path'); }
  const segments = pathname.split('/');
  if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || segments.some((segment) => segment.startsWith('.'))) return reply(404, 'Not found');
  const extension = extname(pathname);
  const isAsset = /^(\/assets\/|\/licenses\/)/.test(pathname) && Boolean(contentTypes[extension]) && extension !== '.html';
  const isPublicFile = ['/index.html', '/favicon.svg', '/reference_tmdb.svg'].includes(pathname) || /^\/demo\/posters\/[a-z0-9_]+\.png$/.test(pathname);
  if (extension && !isAsset && !isPublicFile) return reply(404, 'Not found');
  if (pathname.startsWith('/api/')) return reply(404, 'Not found');
  if (!existsSync(join(clientRoot, 'index.html'))) return reply(503, 'Frontend not built. Run yarn build, or use yarn dev for development.');
  const candidate = resolve(clientRoot, isAsset || isPublicFile ? `.${pathname}` : 'index.html');
  if (!existsSync(candidate)) return reply(404, 'Not found');
  const realRoot = realpathSync(clientRoot);
  const filePath = realpathSync(candidate);
  if (!filePath.startsWith(`${realRoot}${sep}`) || !statSync(filePath).isFile()) return reply(404, 'Not found');
  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(request.method === 'HEAD' ? '' : readFileSync(filePath));
}
