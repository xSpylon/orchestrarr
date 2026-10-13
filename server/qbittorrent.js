// qBittorrent 5 uses stop/start; qBittorrent 4 requires pause/resume.
const endpoints = { pause: ['torrents/stop', 'torrents/pause'], resume: ['torrents/start', 'torrents/resume'] };

export async function controlTorrent(post, action, hash) {
  const [current, fallback] = endpoints[action] || [];
  if (!current) throw new Error(`Unsupported qBittorrent action ${action}`);
  let response = await post(current, { hashes: hash });
  if (response.status === 404) response = await post(fallback, { hashes: hash });
  if (!response.ok) throw new Error(`qBittorrent returned ${response.status}`);
  return { ok: true, action, hash };
}
