// Browser requests must originate from the dashboard. Non-browser clients such as
// Sonarr webhooks normally send neither Origin nor Fetch Metadata headers.
export function sameOriginWriteAllowed(request) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return true;
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = request.headers.origin || request.headers.referer;
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) && url.host === request.headers.host;
  } catch { return false; }
}
