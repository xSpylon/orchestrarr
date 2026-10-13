import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { plexWebUrl, resolvePlexLibraryMatch, xmlAttribute } from './server/plex_match.js';
import { nextServiceHistory, problemStates, stackHealth } from './server/service_events.js';
import { historyAfterDate, summarizeWatchHistory } from './server/tautulli_summary.js';
import { calendarEntry, calendarPath } from './server/calendar.js';
import { mergeDiscoveryPages } from './server/discovery.js';
import { authModeProblem, credentialsAccepted, mergeAuthUpdate } from './server/auth_config.js';
import { imdbIdFromUrl, normalizeRatings } from './server/ratings.js';
import { wizarrInviteLink, wizarrInvitationBody } from './server/wizarr.js';
import { arrMediaUrl } from './server/arr.js';
import { canImportNow, manualImportFiles } from './server/arr_import.js';
import { controlTorrent } from './server/qbittorrent.js';
import { serveStatic } from './server/static_files.js';
import { sameOriginWriteAllowed } from './server/request_security.js';
import { createDemoDashboard, defaultDemoProfile, demoArrMediaMatch, demoBazarrMediaStatus, demoCalendar, demoDiscovery, demoEpisodeDetails, demoMediaContext, demoPlexLibraryMatch, demoProfileInputNames, demoProfileNames, demoRatings, demoSeriesAvailability, demoTitleDetails, demoTitleHistory, demoWizarrManagement, normalizeDemoProfile } from './server/demo_data.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const configPath = process.env.CONFIG_PATH || join(root, 'config.json');
const stateDir = process.env.STATE_DIR || join(root, '.data');
const eventsPath = join(stateDir, 'request-events.json');
const resolutionsPath = join(stateDir, 'resolutions.json');
const apiKeyPath = join(stateDir, 'api_key.json');
const execFileAsync = promisify(execFile);
const dashboardCacheTtlMs = 5000;
let dashboardCache = null;
let dashboardCacheAt = 0;
let dashboardInFlight = null;
const authSessions = new Set();
const authAttempts = new Map();
const eventClients = new Set();
const unconfiguredServiceDetail = 'Add connection details';

function readConfig() {
  const fileConfig = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
  const service = (name, envPrefix) => ({
    ...(fileConfig[name] || {}),
    url: process.env[`${envPrefix}_URL`] || fileConfig[name]?.url || '',
    apiKey: process.env[`${envPrefix}_API_KEY`] || fileConfig[name]?.apiKey || '',
    username: process.env[`${envPrefix}_USERNAME`] || fileConfig[name]?.username || '',
    password: process.env[`${envPrefix}_PASSWORD`] || fileConfig[name]?.password || ''
  });
  return {
    // DEMO_MODE provides the deployment default; an explicit saved setting can be changed from Settings.
    demoMode: typeof fileConfig.demoMode === 'boolean' ? fileConfig.demoMode : (process.env.DEMO_MODE ? process.env.DEMO_MODE !== 'false' : true),
    demoProfile: fileConfig.demoProfile || process.env.DEMO_PROFILE || defaultDemoProfile,
    plex: { ...(fileConfig.plex || {}), url: process.env.PLEX_URL || fileConfig.plex?.url || '', token: process.env.PLEX_TOKEN || fileConfig.plex?.token || '' },
    tautulli: { ...(fileConfig.tautulli || {}), url: process.env.TAUTULLI_URL || fileConfig.tautulli?.url || '', apiKey: process.env.TAUTULLI_API_KEY || fileConfig.tautulli?.apiKey || '' },
    jellyseerr: service('jellyseerr', 'JELLYSEERR'),
    wizarr: { ...service('wizarr', 'WIZARR'), publicUrl: process.env.WIZARR_PUBLIC_URL || fileConfig.wizarr?.publicUrl || '' },
    cleanuparr: service('cleanuparr', 'CLEANUPARR'),
    tdarr: service('tdarr', 'TDARR'),
    prowlarr: service('prowlarr', 'PROWLARR'),
    bazarr: service('bazarr', 'BAZARR'),
    sonarr: service('sonarr', 'SONARR'),
    radarr: service('radarr', 'RADARR'),
    qbittorrent: service('qbittorrent', 'QBITTORRENT'),
    sabnzbd: service('sabnzbd', 'SABNZBD'),
    unraid: service('unraid', 'UNRAID')
    ,docker: { ...(fileConfig.docker || {}), enabled: process.env.DOCKER_ENABLED === 'true' || fileConfig.docker?.enabled === true },
    tmdb: { apiKey: process.env.TMDB_API_KEY || fileConfig.tmdb?.apiKey || '' },
    omdb: { apiKey: process.env.OMDB_API_KEY || fileConfig.omdb?.apiKey || '' },
    notifications: { webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL || fileConfig.notifications?.webhookUrl || '' },
    webhooks: { secret: process.env.ORCHESTRARR_WEBHOOK_SECRET || fileConfig.webhooks?.secret || '' },
    auth: resolveAuth(fileConfig.auth)
  };
}

// API-key mode with no key configured (the Docker default) gets a generated key, kept in the state folder so it survives restarts.
// It is printed once, when it is created; after that it can be read from the file.
let storedApiKey = '';
function prepareApiKey() {
  const { auth } = readConfig();
  if (auth.mode !== 'apikey' || auth.apiKey) return;
  storedApiKey = existsSync(apiKeyPath) ? JSON.parse(readFileSync(apiKeyPath, 'utf8')).apiKey || '' : '';
  if (storedApiKey) { console.log(`Using the API key stored in ${apiKeyPath}.`); return; }
  storedApiKey = randomBytes(32).toString('hex');
  writePrivateJson(apiKeyPath, { apiKey: storedApiKey });
  console.log(`Generated an API key and stored it in ${apiKeyPath}. Use it to sign in; it is only printed this once.\nAPI key: ${storedApiKey}`);
}

// Environment variables override config.json, so Settings shows those fields as managed elsewhere.
const authEnv = { mode: 'AUTH_MODE', apiKey: 'ORCHESTRARR_API_KEY', username: 'AUTH_USERNAME', password: 'AUTH_PASSWORD' };
function resolveAuth(fileAuth = {}) {
  return {
    mode: process.env.AUTH_MODE || fileAuth.mode || 'none',
    apiKey: process.env.ORCHESTRARR_API_KEY || fileAuth.apiKey || storedApiKey,
    username: process.env.AUTH_USERNAME || fileAuth.username || 'admin',
    password: process.env.AUTH_PASSWORD || fileAuth.password || '',
    passwordHash: process.env.AUTH_PASSWORD ? '' : fileAuth.passwordHash || ''
  };
}

const configurableServices = ['plex', 'tautulli', 'jellyseerr', 'wizarr', 'cleanuparr', 'tdarr', 'prowlarr', 'bazarr', 'sonarr', 'radarr', 'qbittorrent', 'sabnzbd', 'unraid', 'tmdb', 'omdb'];

// TMDb and OMDb are cloud APIs, so they only need a key; every other service also needs its URL.
function serviceConfigStatus(config) {
  return Object.fromEntries(configurableServices.map((name) => {
    const service = config[name];
    const hasCredentials = Boolean(service.token || service.apiKey || (service.username && service.password));
    return [name, { url: service.url || '', ...(service.publicUrl !== undefined ? { publicUrl: service.publicUrl } : {}), configured: hasCredentials && (name === 'tmdb' || name === 'omdb' || Boolean(service.url)) }];
  }));
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function validateConfigUrls(payload) {
  for (const name of configurableServices) {
    const service = payload?.[name];
    if (!service || typeof service !== 'object') continue;
    for (const key of ['url', 'publicUrl']) {
      if (service[key] && !isHttpUrl(service[key])) return `${name} ${key === 'publicUrl' ? 'public URL' : 'URL'} must be a valid http:// or https:// URL.`;
    }
  }
  return '';
}

function writePrivateJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    chmodSync(temporaryPath, 0o600);
    renameSync(temporaryPath, filePath);
    chmodSync(filePath, 0o600);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

function updateConfig(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, error: 'Configuration payload must be an object.' };
  const urlProblem = validateConfigUrls(payload);
  if (urlProblem) return { ok: false, error: urlProblem };
  if (payload.demoProfile !== undefined && !demoProfileInputNames.includes(String(payload.demoProfile))) return { ok: false, error: `Demo profile must be one of: ${demoProfileNames.join(', ')}.` };
  const current = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
  if (payload.auth?.mode) {
    const nextAuth = mergeAuthUpdate(current.auth, payload.auth);
    const problem = authModeProblem(resolveAuth(nextAuth));
    if (problem) return { ok: false, error: problem };
    current.auth = nextAuth;
  }
  for (const name of configurableServices) {
    if (!payload[name]) continue;
    current[name] = { ...(current[name] || {}), ...payload[name] };
    for (const key of Object.keys(current[name])) if (!['url', 'publicUrl', 'apiKey', 'token', 'username', 'password'].includes(key)) delete current[name][key];
  }
  if (payload.notifications?.webhookUrl !== undefined) current.notifications = { ...(current.notifications || {}), webhookUrl: payload.notifications.webhookUrl };
  if (typeof payload.demoMode === 'boolean') current.demoMode = payload.demoMode;
  if (payload.demoProfile !== undefined) current.demoProfile = normalizeDemoProfile(payload.demoProfile);
  writePrivateJson(configPath, current);
  dashboardCache = null;
  dashboardCacheAt = 0;
  const config = readConfig();
  return { ok: true, config: { demoMode: config.demoMode, demoProfile: config.demoProfile, services: serviceConfigStatus(config) } };
}

function readRequestEvents() {
  if (!existsSync(eventsPath)) return {};
  try { return JSON.parse(readFileSync(eventsPath, 'utf8')); } catch { return {}; }
}

function writeRequestEvents(events) {
  writePrivateJson(eventsPath, events);
}

function readResolutions() {
  if (!existsSync(resolutionsPath)) return {};
  try { return JSON.parse(readFileSync(resolutionsPath, 'utf8')); } catch { return {}; }
}

function writeResolutions(resolutions) {
  writePrivateJson(resolutionsPath, resolutions);
}

function requestIdentity(item) {
  return String(item.requestId || item.externalId || `${item.mediaType || item.detail}:${item.title}`).toLowerCase();
}

function observeRequestEvents(requests) {
  const stored = readRequestEvents();
  const observedAt = new Date().toISOString();
  const migratedStates = new Map();
  let changed = false;
  const result = requests.map((item) => {
    const key = requestIdentity(item);
    let history = Array.isArray(stored[key]) ? stored[key] : [];
    const legacyKey = String(item.externalId || '').toLowerCase();
    if (!history.length && item.requestId && legacyKey && Array.isArray(stored[legacyKey])) {
      const usedStates = migratedStates.get(legacyKey) || new Set();
      migratedStates.set(legacyKey, usedStates);
      const createdAt = Date.parse(item.createdAt || '');
      const legacyEvent = stored[legacyKey].find((event) => event.type === 'status_changed'
        && event.state === item.state
        && !usedStates.has(event.state)
        && (!Number.isFinite(createdAt) || Date.parse(event.at) >= createdAt));
      if (legacyEvent) {
        history = [legacyEvent];
        usedStates.add(legacyEvent.state);
      }
    }
    const previous = history.slice().reverse().find((event) => ['tracking_started', 'status_changed'].includes(event.type));
    if (!previous) {
      history.push({ type: 'tracking_started', title: 'Tracking started', detail: `First observed as ${item.state}`, source: 'Orchestrarr', at: observedAt });
      changed = true;
    } else if (previous.state !== item.state) {
      history.push({ type: 'status_changed', title: `Status changed to ${item.state}`, detail: 'Reported by Jellyseerr', source: 'Jellyseerr', state: item.state, at: observedAt });
      changed = true;
    }
    stored[key] = history.slice(-50);
    return { ...item, events: stored[key], eventTracking: { startedAt: stored[key][0]?.at || observedAt, historicalData: false } };
  });
  if (changed) writeRequestEvents(stored);
  return result;
}

function observePipelineEvents(items) {
  const stored = readRequestEvents();
  const observedAt = new Date().toISOString();
  let changed = false;
  const result = items.map((item) => {
    const key = `pipeline:${item.service}:${item.sourceId || item.torrentHash || item.title}`.toLowerCase();
    const history = Array.isArray(stored[key]) ? stored[key] : [];
    const previous = history[history.length - 1];
    if (!previous) {
      history.push({ type: 'tracking_started', title: 'Pipeline tracking started', detail: `First observed as ${item.state}`, source: item.service, state: item.state, at: observedAt });
      changed = true;
    } else if (previous.state !== item.state) {
      history.push({ type: 'status_changed', title: `${item.service} status changed to ${item.state}`, detail: item.detail || 'Pipeline status changed', source: item.service, state: item.state, at: observedAt });
      changed = true;
    }
    stored[key] = history.slice(-50);
    return { ...item, events: stored[key] };
  });
  if (changed) writeRequestEvents(stored);
  return result;
}

function observeServiceEvents(services) {
  const stored = readRequestEvents();
  const observedAt = new Date().toISOString();
  let changed = false;
  const result = services.map((service) => {
    const key = `service:${service.name}`.toLowerCase();
    const history = Array.isArray(stored[key]) ? stored[key] : [];
    const next = nextServiceHistory(history, service, observedAt);
    if (next !== history) { stored[key] = next; changed = true; }
    return { ...service, events: next.filter((event) => !event.silent) };
  });
  if (changed) writeRequestEvents(stored);
  return result;
}

function recordWebhookEvent(serviceName, payload) {
  const movie = payload.movie || payload.media || {};
  const series = payload.series || {};
  const tmdbId = movie.tmdbId || series.tmdbId || payload.tmdbId || payload.media?.tmdbId || '';
  const title = movie.title || series.title || payload.title || payload.eventType || 'Media event';
  const key = String(tmdbId || `${serviceName}:${title}`).toLowerCase();
  const stored = readRequestEvents();
  const history = Array.isArray(stored[key]) ? stored[key] : [];
  const eventType = payload.eventType || payload.event || 'Webhook received';
  const previous = history[history.length - 1];
  if (!previous || previous.source !== serviceName || previous.detail !== eventType) {
    history.push({ type: 'webhook', title: `${serviceName}: ${title}`, detail: eventType, source: serviceName, state: eventType, at: new Date().toISOString() });
    stored[key] = history.slice(-50);
    writeRequestEvents(stored);
  }
  return { ok: true, service: serviceName, title, eventType };
}

function broadcastEvent(event) {
  const payload = `data: ${JSON.stringify({ ...event, at: new Date().toISOString() })}\n\n`;
  for (const client of eventClients) {
    try { client.write(payload); } catch { eventClients.delete(client); }
  }
}

function collectActivity(requests = [], pipeline = [], services = []) {
  const requestEvents = requests.flatMap((request) => (request.events || []).map((event) => ({
    id: `request-${request.requestId || request.externalId || request.title}-${event.at}`,
    title: event.title,
    detail: `${request.title} · ${event.detail}`,
    service: event.source || 'Orchestrarr',
    type: event.type || 'status_changed',
    severity: request.state === 'Failed' ? 'failed' : 'info',
    state: request.state,
    at: event.at,
    relatedType: 'request',
    relatedId: request.requestId || request.externalId || request.title,
    tmdbId: request.tmdbId || '',
    mediaType: request.mediaType || ''
  })));
  const pipelineEvents = pipeline.flatMap((item) => (item.events || []).map((event) => ({
    id: `pipeline-${item.service}-${item.sourceId || item.title}-${event.at}`,
    title: event.title,
    detail: `${item.title} · ${event.detail}`,
    service: event.source || item.service,
    type: event.type || 'status_changed',
    severity: item.needsAction ? 'attention' : 'info',
    state: item.state,
    at: event.at,
    relatedType: 'pipeline',
    relatedId: item.sourceId || item.title,
    tmdbId: item.tmdbId || '',
    mediaType: item.mediaType || ''
  })));
  const serviceEvents = services.flatMap((service) => (service.events || []).map((event) => ({
    id: `service-${service.name}-${event.at}`,
    title: event.title,
    detail: event.detail,
    service: service.name,
    type: event.type,
    severity: event.state === 'Offline' ? 'failed' : problemStates.includes(event.state) ? 'attention' : 'info',
    state: event.state,
    at: event.at,
    relatedType: 'service',
    relatedId: service.name
  })));
  return [...requestEvents, ...pipelineEvents, ...serviceEvents].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 100);
}

function collectAlerts(pipeline = [], services = []) {
  const resolutions = readResolutions();
  return [
    ...services.filter((service) => problemStates.includes(service.state)).map((service) => ({
      id: `service-${service.name}`, title: `${service.name} needs attention`, detail: service.detail, severity: service.state === 'Offline' ? 'failed' : 'attention', state: service.state, relatedType: 'service', relatedId: service.name
    })),
    ...pipeline.filter((item) => item.needsAction).map((item) => ({
      id: `pipeline-${item.service}-${item.sourceId || item.title}`, title: item.title, detail: `${item.state} · ${item.detail}`, severity: item.state.toLowerCase().includes('failed') || item.state.toLowerCase().includes('blocked') ? 'failed' : 'attention', state: item.state, service: item.service, relatedType: 'pipeline', relatedId: item.sourceId || item.title
    }))
  ].map((alert) => ({ ...alert, resolved: Boolean(resolutions[alert.id]), updatedAt: new Date().toISOString() }));
}

function readBody(request) {
  return new Promise((resolve, reject) => { const chunks = []; request.on('data', (chunk) => chunks.push(chunk)); request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); request.on('error', reject); });
}


async function fetchPlex(config) {
  if (!config.plex.url || !config.plex.token) throw new Error('Plex URL and token are required');
  const response = await fetch(`${config.plex.url.replace(/\/$/, '')}/status/sessions?X-Plex-Token=${encodeURIComponent(config.plex.token)}`, { headers: { Accept: 'application/xml' } });
  if (!response.ok) throw new Error(`Plex returned ${response.status}`);
  const xml = await response.text();
  const videos = [...xml.matchAll(/<Video\b[^>]*>/gi)];
  return videos.map((match, index) => {
    const segment = xml.slice(match.index, videos[index + 1]?.index || xml.length);
    const decision = xmlAttribute(match[0], 'videoDecision') || xmlAttribute(segment, 'Part', 'decision') || '';
    const resolution = xmlAttribute(match[0], 'videoResolution') || xmlAttribute(segment, 'Media', 'videoResolution');
    const quality = resolution ? (/^\d+$/.test(resolution) ? `${resolution}p` : resolution) : 'Unknown';
    const duration = Number(xmlAttribute(match[0], 'Video', 'duration') || 0);
    const viewOffset = Number(xmlAttribute(match[0], 'Video', 'viewOffset') || 0);
    return { title: xmlAttribute(match[0], 'Video', 'grandparentTitle') || xmlAttribute(match[0], 'Video', 'title') || 'Unknown media', ratingKey: xmlAttribute(match[0], 'Video', 'ratingKey'), grandparentRatingKey: xmlAttribute(match[0], 'Video', 'grandparentRatingKey'), user: xmlAttribute(match[0], 'Video', 'user') || xmlAttribute(segment, 'User', 'title') || 'Unknown user', quality, mode: decision.toLowerCase().includes('transcode') ? 'Transcoding' : decision.toLowerCase().includes('directstream') ? 'Direct Stream' : 'Direct Play', server: 'Plex', device: xmlAttribute(segment, 'Player', 'device') || 'Unknown device', client: xmlAttribute(segment, 'Player', 'product') || xmlAttribute(segment, 'Player', 'platform') || 'Unknown client', videoCodec: xmlAttribute(segment, 'Media', 'videoCodec') || 'Unknown', audioCodec: xmlAttribute(segment, 'Media', 'audioCodec') || 'Unknown', bandwidth: Number(xmlAttribute(segment, 'Session', 'bandwidth') || 0), duration: duration ? Math.round(duration / 1000) : 0, progress: duration ? Math.round((viewOffset / duration) * 100) : 0 };
  });
}

function xmlNodes(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function normalizeQueueState(value) {
  const state = String(value || '').trim();
  const labels = { downloading: 'Downloading', queued: 'Queued', completed: 'Completed', importing: 'Importing', importpending: 'Pending', importblocked: 'Blocked', failed: 'Failed', warning: 'Attention', error: 'Error', stalled: 'Stalled', checking: 'Checking', paused: 'Paused', seeding: 'Seeding' };
  return labels[state.toLowerCase()] || state || 'Queued';
}

function formatCapacityKilobytes(value) {
  const bytes = Number(value) * 1024;
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes <= 1000) return `${Number.isInteger(bytes) ? bytes : bytes.toFixed(1)} TB`;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let amount = bytes;
  let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1; }
  const precision = unit >= 4 ? 2 : amount >= 10 || unit === 0 ? 0 : 1;
  return `${Number(amount.toFixed(precision))} ${units[unit]}`;
}

function formatUptime(value) {
  const timestamp = Date.parse(String(value || ''));
  const seconds = Number.isNaN(timestamp) ? Number(value) : Math.max(0, (Date.now() - timestamp) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return value ? String(value) : null;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days ? `${days}d ${hours}h uptime` : `${hours}h uptime`;
}

async function plexXml(config, path) {
  if (!config.plex.url || !config.plex.token) throw new Error('Plex URL and token are required');
  const url = `${config.plex.url.replace(/\/$/, '')}${path}${path.includes('?') ? '&' : '?'}X-Plex-Token=${encodeURIComponent(config.plex.token)}`;
  const response = await fetch(url, { headers: { Accept: 'application/xml' }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Plex returned ${response.status}`);
  return response.text();
}

async function fetchPlexLibrary(config) {
  const sectionsXml = await plexXml(config, '/library/sections');
  const sections = xmlNodes(sectionsXml, 'Directory').filter((node) => xmlAttribute(node, 'key'));
  const libraries = await Promise.all(sections.map(async (section) => {
    const key = xmlAttribute(section, 'key');
    const type = xmlAttribute(section, 'type');
    const libraryName = xmlAttribute(section, 'title');
    const toItems = (xml) => xmlNodes(xml, 'Video').concat(xmlNodes(xml, 'Directory')).map((node) => {
      const ratingKey = xmlAttribute(node, 'ratingKey');
      if (!ratingKey) return null;
      return { ratingKey, title: xmlAttribute(node, 'title') || 'Untitled', year: xmlAttribute(node, 'year') || '', addedAt: xmlAttribute(node, 'addedAt') || '', type: xmlAttribute(node, 'type') || type, library: libraryName, parentRatingKey: xmlAttribute(node, 'parentRatingKey'), grandparentRatingKey: xmlAttribute(node, 'grandparentRatingKey'), parentTitle: xmlAttribute(node, 'parentTitle'), grandparentTitle: xmlAttribute(node, 'grandparentTitle'), parentIndex: xmlAttribute(node, 'parentIndex'), index: xmlAttribute(node, 'index'), episodeCount: Number(xmlAttribute(node, 'leafCount')) || 0, thumb: `/api/media/${encodeURIComponent(ratingKey)}/artwork` };
    }).filter(Boolean);
    const recentXml = await plexXml(config, `/library/sections/${encodeURIComponent(key)}/recentlyAdded?X-Plex-Container-Size=24`);
    let recentItems = toItems(recentXml);
    if (!recentItems.length) recentItems = toItems(await plexXml(config, `/library/sections/${encodeURIComponent(key)}/all?X-Plex-Container-Size=24&sort=addedAt:desc`));

    const allItems = [];
    const pageSize = 200;
    let start = 0;
    let totalSize = Infinity;
    while (start < totalSize) {
      const xml = await plexXml(config, `/library/sections/${encodeURIComponent(key)}/all?X-Plex-Container-Size=${pageSize}&X-Plex-Container-Start=${start}&sort=titleSort:asc`);
      const page = toItems(xml);
      allItems.push(...page);
      const reportedTotal = Number(xmlAttribute(xml, 'MediaContainer', 'totalSize'));
      totalSize = Number.isFinite(reportedTotal) && reportedTotal >= 0 ? reportedTotal : start + page.length;
      if (page.length < pageSize) break;
      start += page.length;
    }
    return { recentItems, allItems };
  }));
  const unique = (items) => [...new Map(items.map((item) => [item.ratingKey, item])).values()];
  return { items: unique(libraries.flatMap((library) => library.recentItems.slice(0, 24))), allItems: unique(libraries.flatMap((library) => library.allItems)), sections: sections.length };
}

function plexMediaRecord(xml, requestedRatingKey) {
  const tag = xml.match(/<(Video|Directory)\b/i)?.[1] || 'Video';
  const ratingKey = xmlAttribute(xml, tag, 'ratingKey') || requestedRatingKey;
  const guids = [...xml.matchAll(/<Guid\b[^>]*\bid="([^"]+)"/gi)].map((match) => match[1]);
  const tmdbId = guids.find((guid) => guid.startsWith('tmdb://'))?.slice('tmdb://'.length) || '';
  return {
    ratingKey,
    title: xmlAttribute(xml, tag, 'title') || 'Untitled',
    year: xmlAttribute(xml, tag, 'year') || '',
    type: xmlAttribute(xml, tag, 'type') || '',
    tmdbId,
    thumb: `/api/media/${encodeURIComponent(ratingKey)}/artwork`
  };
}

async function fetchPlexMediaContext(config, ratingKey) {
  if (!config.plex.url || !config.plex.token) throw new Error('Plex URL and token are required');
  const xml = await plexXml(config, `/library/metadata/${encodeURIComponent(ratingKey)}?includeGuids=1`);
  const type = xmlAttribute(xml, xml.match(/<(Video|Directory)\b/i)?.[1] || 'Video', 'type').toLowerCase();
  const isEpisode = type === 'episode';
  const isSeason = type === 'season';
  const seriesRatingKey = isEpisode ? xmlAttribute(xml, 'Video', 'grandparentRatingKey') : isSeason ? xmlAttribute(xml, 'Directory', 'parentRatingKey') : '';
  const seasonIndex = xmlAttribute(xml, isEpisode ? 'Video' : 'Directory', isEpisode ? 'parentIndex' : 'index');
  const episodeIndex = xmlAttribute(xml, 'Video', 'index');
  const focus = isEpisode ? {
    kind: 'episode',
    ...(seasonIndex !== '' ? { seasonNumber: Number(seasonIndex) } : {}),
    ...(episodeIndex !== '' ? { episodeNumber: Number(episodeIndex) } : {}),
    episodeTitle: xmlAttribute(xml, 'Video', 'title') || ''
  } : isSeason ? {
    kind: 'season',
    ...(seasonIndex !== '' ? { seasonNumber: Number(seasonIndex) } : {})
  } : undefined;

  if (seriesRatingKey) {
    const seriesXml = await plexXml(config, `/library/metadata/${encodeURIComponent(seriesRatingKey)}?includeGuids=1`);
    return { item: plexMediaRecord(seriesXml, seriesRatingKey), focus };
  }

  return { item: plexMediaRecord(xml, ratingKey), focus: undefined };
}

// The server ID never changes for a Plex install, so one lookup per process is enough.
let plexMachineIdentifier = '';
async function fetchPlexMachineIdentifier(config) {
  if (!plexMachineIdentifier) plexMachineIdentifier = xmlAttribute(await plexXml(config, '/identity'), 'MediaContainer', 'machineIdentifier');
  return plexMachineIdentifier;
}

async function fetchPlexLibraryMatch(config, mediaType, tmdbId, title) {
  if (!config.plex.url || !config.plex.token) return { status: 'unconfigured' };
  try {
    const plexType = mediaType === 'tv' ? 2 : 1;
    const xml = await plexXml(config, `/hubs/search?query=${encodeURIComponent(title)}&type=${plexType}&limit=20&includeGuids=1`);
    const match = resolvePlexLibraryMatch(xml, mediaType, tmdbId);
    if (match.status !== 'found') return match;
    const machineIdentifier = await fetchPlexMachineIdentifier(config).catch(() => '');
    return { ...match, webUrl: plexWebUrl(machineIdentifier, match.ratingKey) };
  } catch {
    return { status: 'unavailable' };
  }
}

async function fetchArrMediaMatch(config, mediaType, tmdbId, title) {
  const serviceName = mediaType === 'tv' ? 'Sonarr' : 'Radarr';
  const service = mediaType === 'tv' ? config.sonarr : config.radarr;
  if (!service?.url || !service.apiKey) return { status: 'unconfigured', detail: `${serviceName} not configured` };
  try {
    const base = service.url.replace(/\/$/, '');
    const api = `apiKey=${encodeURIComponent(service.apiKey)}`;
    const records = await fetchJson(`${base}/api/v3/${mediaType === 'tv' ? 'series' : 'movie'}?${api}`);
    if (!tmdbId) return { status: 'unresolved', detail: 'TMDb ID is required for an exact Radarr match' };
    const match = records.find((entry) => String(entry.tmdbId || '') === String(tmdbId));
    if (!match) {
      const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const titleCandidate = records.some((entry) => normalize(entry.title) === normalize(title));
      return titleCandidate
        ? { status: 'unresolved', detail: `${serviceName} has a title match without a confirming TMDb ID` }
        : { status: 'not-tracked', detail: `Not tracked in ${serviceName}` };
    }
    if (mediaType === 'tv') return { status: 'tracked', detail: 'Tracked in Sonarr', id: match.id };
    return match.hasFile
      ? { status: 'available', detail: 'Movie file in Radarr', id: match.id }
      : { status: 'tracked', detail: 'In Radarr · movie file missing', id: match.id };
  } catch {
    return { status: 'unavailable', detail: `${serviceName} lookup unavailable` };
  }
}

async function fetchTautulli(config) {
  if (!config.tautulli.url || !config.tautulli.apiKey) throw new Error('Tautulli URL and API key are required');
  const url = `${config.tautulli.url.replace(/\/$/, '')}/api/v2?apikey=${encodeURIComponent(config.tautulli.apiKey)}&cmd=get_activity`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Tautulli returned ${response.status}`);
  const payload = await response.json();
  return payload?.response?.data?.sessions || [];
}

async function fetchTautulliCommand(config, command, params = '') {
  if (!config.tautulli.url || !config.tautulli.apiKey) throw new Error('Tautulli URL and API key are required');
  const url = `${config.tautulli.url.replace(/\/$/, '')}/api/v2?apikey=${encodeURIComponent(config.tautulli.apiKey)}&cmd=${command}${params}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Tautulli returned ${response.status}`);
  const payload = await response.json();
  return payload?.response?.data;
}

async function fetchTautulliRecentMedia(config) {
  const data = await fetchTautulliCommand(config, 'get_recently_added', '&count=24');
  const items = Array.isArray(data) ? data : data?.recently_added || [];
  return items.map((item) => ({ ratingKey: item.rating_key || item.ratingKey || '', title: item.title || item.grandparent_title || 'Untitled', year: item.year || '', type: item.media_type || item.mediaType || 'Media', library: item.section_name || item.library_name || '', thumb: `/api/media/${encodeURIComponent(item.rating_key || item.ratingKey || '')}/artwork` })).filter((item) => item.ratingKey);
}

const WATCH_PERIOD_DAYS = 30;

async function fetchTautulliAnalytics(config) {
  // ponytail: minutes sum at most 1000 plays in the window; plays itself uses Tautulli's filtered total.
  const [data, period] = await Promise.all([
    fetchTautulliCommand(config, 'get_history', '&length=50'),
    fetchTautulliCommand(config, 'get_history', `&after=${historyAfterDate(WATCH_PERIOD_DAYS)}&length=1000`)
  ]);
  const rows = Array.isArray(data) ? data : data?.data || data?.history || [];
  const history = rows.map((item) => ({
    title: item.full_title || item.title || item.grandparent_title || 'Unknown media',
    seriesTitle: item.grandparent_title || '',
    user: item.user || item.friendly_name || 'Unknown user',
    watchedAt: item.date || item.started || item.started_at || item.timestamp || '',
    duration: Number(item.duration || item.play_duration || 0),
    platform: item.platform || item.product || 'Unknown client',
    ratingKey: item.rating_key || item.ratingKey || ''
  }));
  return { history, summary: summarizeWatchHistory(period, WATCH_PERIOD_DAYS) };
}

async function fetchTautulliTitleHistory(config, mediaType, title, ratingKey) {
  if (!ratingKey) return [];
  const params = new URLSearchParams({ length: '1000' });
  if (ratingKey) params.set(mediaType === 'tv' ? 'grandparent_rating_key' : 'rating_key', ratingKey);
  const data = await fetchTautulliCommand(config, 'get_history', `&${params.toString()}`);
  const rows = Array.isArray(data) ? data : data?.data || data?.history || [];
  return rows.map((item) => ({
    title: item.full_title || item.title || item.grandparent_title || 'Unknown media',
    seriesTitle: item.grandparent_title || '',
    user: item.user || item.friendly_name || 'Unknown user',
    watchedAt: item.date || item.started || item.started_at || item.timestamp || '',
    duration: Number(item.duration || item.play_duration || 0),
    platform: item.platform || item.product || 'Unknown client',
    ratingKey: item.rating_key || item.ratingKey || '',
    grandparentRatingKey: item.grandparent_rating_key || item.grandparentRatingKey || ''
  })).filter((item) => mediaType === 'tv'
    ? String(item.grandparentRatingKey) === String(ratingKey)
    : String(item.ratingKey) === String(ratingKey));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function tmdbRequest(config, path, params = {}) {
  if (!config.tmdb.apiKey) throw new Error('TMDb API key is not configured');
  const query = new URLSearchParams({ api_key: config.tmdb.apiKey, language: 'en-US', ...params });
  return fetchJson(`https://api.themoviedb.org/3${path}?${query.toString()}`);
}

async function omdbRequest(config, params) {
  const response = await fetchJson(`https://www.omdbapi.com/?${new URLSearchParams({ apikey: config.omdb.apiKey, ...params })}`);
  if (response.Response === 'False' && /api key/i.test(response.Error || '')) throw new Error(response.Error);
  return response;
}

// OMDb is optional: without a key, title pages simply show no Metacritic score.
async function fetchOmdb(config) {
  if (!config.omdb?.apiKey) throw new Error('Not configured');
  await omdbRequest(config, { i: 'tt0111161' });
  return { name: 'OMDb', state: 'Healthy', detail: 'API key accepted' };
}

// Every source is optional; a title page shows whichever ratings came back.
async function fetchRatings(config, mediaType, tmdbId) {
  const jellyseerrPath = mediaType === 'tv' ? `/api/v1/tv/${encodeURIComponent(tmdbId)}/ratings` : `/api/v1/movie/${encodeURIComponent(tmdbId)}/ratingscombined`;
  const jellyseerr = config.jellyseerr.url && config.jellyseerr.apiKey
    ? await fetchJson(`${config.jellyseerr.url.replace(/\/$/, '')}${jellyseerrPath}`, { headers: { 'X-Api-Key': config.jellyseerr.apiKey } })
      .then((payload) => (mediaType === 'tv' ? { rt: payload } : payload)).catch(() => undefined)
    : undefined;
  let imdbId = imdbIdFromUrl(jellyseerr?.imdb?.url);
  if (!imdbId && config.tmdb.apiKey) imdbId = await tmdbRequest(config, `/${mediaType}/${encodeURIComponent(tmdbId)}/external_ids`).then((ids) => ids.imdb_id || '').catch(() => '');
  const omdb = config.omdb.apiKey && imdbId ? await omdbRequest(config, { i: imdbId }).catch(() => undefined) : undefined;
  return normalizeRatings({ jellyseerr, omdb, imdbId });
}

async function fetchTmdb(config) {
  if (!config.tmdb?.apiKey) throw new Error('Not configured');
  await tmdbRequest(config, '/configuration');
  return { name: 'TMDb', state: 'Healthy', detail: 'API key accepted' };
}

async function fetchDiscovery(config, query = '', page = 0) {
  const requestedPages = page > 0 ? [page] : [1, 2, 3];
  const pages = await Promise.all(requestedPages.map((pageNumber) => tmdbRequest(config, query ? '/search/multi' : '/trending/all/week', query ? { query, include_adult: 'false', page: String(pageNumber) } : { page: String(pageNumber) })));
  return { mode: query ? 'search' : 'trending', query, ...mergeDiscoveryPages(pages) };
}

async function fetchEpisodeDetails(config, tmdbId, seasonNumber, episodeNumber) {
  if (!tmdbId || !Number.isInteger(seasonNumber) || seasonNumber < 0 || !Number.isInteger(episodeNumber) || episodeNumber < 1) {
    throw new Error('A TMDb show ID, season number, and episode number are required');
  }
  let listedEpisode;
  try {
    const season = await tmdbRequest(config, `/tv/${encodeURIComponent(tmdbId)}/season/${seasonNumber}`);
    listedEpisode = (season.episodes || []).find((episode) => Number(episode.episode_number) === episodeNumber);
  } catch { /* Try the episode endpoint if the season listing is unavailable. */ }

  let detail = {};
  try { detail = await tmdbRequest(config, `/tv/${encodeURIComponent(tmdbId)}/season/${seasonNumber}/episode/${episodeNumber}`); } catch { /* The season listing may still contain the episode details. */ }

  if (listedEpisode) {
    return {
      ...listedEpisode,
      ...detail,
      overview: String(listedEpisode.overview || '').trim() || detail.overview || ''
    };
  }
  return detail;
}

async function fetchCalendar(config, from, to) {
  const start = from || new Date().toISOString().slice(0, 10);
  const end = to || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const adapters = [{ client: config.sonarr, service: 'Sonarr' }, { client: config.radarr, service: 'Radarr' }];
  const entries = (await Promise.all(adapters.map(async ({ client, service }) => {
    try {
      if (!client?.url || !client.apiKey) return [];
      const api = `apiKey=${encodeURIComponent(client.apiKey)}`;
      const base = client.url.replace(/\/$/, '');
      const data = await fetchJson(`${base}${calendarPath(service, start, end)}&${api}`);
      return data.map((item) => calendarEntry(item, service));
    } catch { return []; }
  }))).flat().sort((a, b) => new Date(a.date) - new Date(b.date));
  return { from: start, to: end, entries: entries.filter((entry) => !entry.date || entry.date >= `${start}T00:00:00`).filter((entry) => !entry.date || entry.date <= `${end}T23:59:59`) };
}

async function fetchArrQueue(service, name) {
  if (!service?.url || !service.apiKey) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const api = `apiKey=${encodeURIComponent(service.apiKey)}`;
  const queue = await fetchJson(`${base}/api/v3/queue?page=1&pageSize=100&sortKey=downloadStatus&sortDir=descending&${api}`);
  const records = queue.records || [];
  const items = await Promise.all(records.map(async (item) => {
    let title = item.title || item.series?.title || 'Unknown media';
    const detailPath = name === 'Radarr' && item.movieId ? `/api/v3/movie/${encodeURIComponent(item.movieId)}?${api}` : name === 'Sonarr' && item.seriesId ? `/api/v3/series/${encodeURIComponent(item.seriesId)}?${api}` : '';
    let linkedMedia = item.movie || item.series || {};
    if (detailPath) {
      try { const detail = await fetchJson(`${base}${detailPath}`); linkedMedia = detail; title = detail.title || detail.seriesName || title; } catch { /* Queue data remains usable when the detail lookup fails. */ }
    }
    const needsAction = item.trackedDownloadStatus === 'warning' || item.trackedDownloadStatus === 'error';
    const state = needsAction && item.trackedDownloadState ? `Import ${normalizeQueueState(item.trackedDownloadState).toLowerCase()}` : normalizeQueueState(item.status);
    const openUrl = arrMediaUrl(base, name, linkedMedia);
    const importAction = canImportNow(item);
    return { title, detail: item.errorMessage || item.episodeTitle || item.quality?.quality?.name || 'Queue item', service: name, state, progress: Number(item.sizeleft && item.size ? Math.round((1 - item.sizeleft / item.size) * 100) : 0), needsAction, importAction, blocklistAction: needsAction, openUrl, tmdbId: linkedMedia.tmdbId || '', mediaType: name === 'Sonarr' ? 'tv' : 'movie', sourceId: item.movieId || item.seriesId || '', queueId: item.id || '', actionType: name === 'Sonarr' ? 'series' : 'movie', actionId: item.movieId || item.seriesId || '', ...(needsAction ? {} : { retryAction: 'search' }) };
  }));
  let missing = [];
  try {
    const wanted = await fetchJson(`${base}/api/v3/wanted/missing?page=1&pageSize=50&sortKey=airDateUtc&sortDir=descending&${api}`);
    missing = (wanted.records || []).map((item) => ({ title: item.title || item.movie?.title || item.series?.title || 'Unknown media', detail: name === 'Sonarr' ? `S${String(item.seasonNumber || 0).padStart(2, '0')} E${String(item.episodeNumber || 0).padStart(2, '0')}` : 'Movie', type: name === 'Sonarr' ? 'Series' : 'Movie', library: name, state: 'Missing', year: item.year || item.movie?.year || '' }));
  } catch { /* Wanted endpoints are optional on older *arr versions. */ }
  return { name, state: 'Healthy', detail: `${items.length} queue item${items.length === 1 ? '' : 's'}`, pipeline: items, missing };
}

async function fetchSeriesAvailability(config, tmdbId, title) {
  const service = config.sonarr;
  const configured = Boolean(service.url && service.apiKey);
  let sonarrSeries = null;
  let sonarrUnavailable = false;
  let sonarrMatchUnresolved = false;
  if (configured) {
    const base = service.url.replace(/\/$/, '');
    const api = `apiKey=${encodeURIComponent(service.apiKey)}`;
    try {
      const series = await fetchJson(`${base}/api/v3/series?${api}`);
      const match = tmdbId ? series.find((entry) => String(entry.tmdbId || '') === String(tmdbId)) : null;
      if (!match && tmdbId && title) {
        const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        sonarrMatchUnresolved = series.some((entry) => normalize(entry.title) === normalize(title));
      }
      if (match) {
        const episodes = await fetchJson(`${base}/api/v3/episode?seriesId=${encodeURIComponent(match.id)}&${api}`);
        let queue = [];
        try {
          const queueData = await fetchJson(`${base}/api/v3/queue?page=1&pageSize=500&${api}`);
          queue = (queueData.records || []).filter((item) => Number(item.seriesId) === Number(match.id));
        } catch { /* Episode availability remains useful if the queue endpoint is unavailable. */ }
        const queueByEpisode = new Map();
        for (const item of queue) {
          const trackedStatus = String(item.trackedDownloadStatus || '').toLowerCase();
          const queueStatus = trackedStatus === 'error' ? 'Import error' : trackedStatus === 'warning' ? 'Import warning' : normalizeQueueState(item.trackedDownloadState || item.status);
          const messages = Array.isArray(item.statusMessages) ? item.statusMessages.flatMap((entry) => entry.messages || []) : [];
          const detail = item.errorMessage || messages.join(' · ') || '';
          const queueEpisodeIds = [...(Array.isArray(item.episodeIds) ? item.episodeIds : []), item.episodeId, item.episode?.id].map(Number).filter((episodeId) => Number.isFinite(episodeId) && episodeId > 0);
          for (const episodeId of queueEpisodeIds) queueByEpisode.set(episodeId, { status: queueStatus, detail, progress: Number(item.size && item.sizeleft != null ? Math.round((1 - item.sizeleft / item.size) * 100) : 0) });
        }
        const seasons = (match.seasons || []).map((season) => {
          const seasonEpisodes = episodes.filter((episode) => Number(episode.seasonNumber) === Number(season.seasonNumber)).sort((a, b) => Number(a.episodeNumber) - Number(b.episodeNumber));
          return {
            seasonNumber: season.seasonNumber,
            episodeFileCount: Number(season.statistics?.episodeFileCount || seasonEpisodes.filter((episode) => episode.hasFile).length),
            totalEpisodeCount: Number(season.statistics?.totalEpisodeCount || seasonEpisodes.length),
            episodes: seasonEpisodes.map((episode) => ({
              episodeNumber: episode.episodeNumber,
              title: episode.title || 'Untitled episode',
              airDateUtc: episode.airDateUtc || '',
              overview: episode.overview || '',
              runtime: Number(episode.runtime || 0),
              id: episode.id,
              hasFile: Boolean(episode.hasFile),
              monitored: Boolean(episode.monitored),
              queue: queueByEpisode.get(Number(episode.id)) || null
            }))
          };
        });
        sonarrSeries = { seriesId: match.id, seriesTitle: match.title || match.seriesName || title, seasons, source: 'sonarr' };
      }
    } catch { sonarrUnavailable = true; }
  }
  let tmdbGuide = null;
  let tmdbGuideUnavailable = false;
  if (!sonarrSeries && tmdbId) {
    try {
      const show = await tmdbRequest(config, `/tv/${encodeURIComponent(tmdbId)}`);
      const tmdbSeasons = await Promise.all((show.seasons || []).map(async (season) => {
        const seasonNumber = Number(season.season_number);
        let episodes = [];
        try {
          const detail = await tmdbRequest(config, `/tv/${encodeURIComponent(tmdbId)}/season/${encodeURIComponent(seasonNumber)}`);
          episodes = (detail.episodes || []).map((episode) => ({
            id: episode.id,
            episodeNumber: episode.episode_number,
            title: episode.name || 'Untitled episode',
            airDateUtc: episode.air_date || '',
            hasFile: false,
            monitored: false,
            source: 'tmdb'
          }));
        } catch { /* Keep the season visible even when TMDb has no episode details for it. */ }
        return {
          seasonNumber,
          episodeFileCount: 0,
          totalEpisodeCount: Number(season.episode_count || episodes.length),
          episodes
        };
      }));
      tmdbGuide = { source: 'tmdb', seriesTitle: show.name || title, seasons: tmdbSeasons };
    } catch {
      tmdbGuideUnavailable = true;
    }
  }
  return {
    series: sonarrSeries || tmdbGuide,
    sonarrUnavailable,
    sonarrMatchUnresolved,
    configured,
    tmdbGuideUnavailable
  };
}

async function fetchBazarrMediaStatus(config, mediaType, tmdbId, title, seriesId, episodeId) {
  const bazarr = config.bazarr;
  if (!bazarr.url || !bazarr.apiKey) return { status: 'unconfigured', detail: 'Bazarr not configured' };

  try {
    const arrService = mediaType === 'tv' ? config.sonarr : config.radarr;
    if (!arrService.url || !arrService.apiKey) return { status: 'not-tracked', detail: `${mediaType === 'tv' ? 'Sonarr' : 'Radarr'} is not configured` };
    const arrBase = arrService.url.replace(/\/$/, '');
    const arrApi = `apiKey=${encodeURIComponent(arrService.apiKey)}`;
    let arrId = Number(mediaType === 'tv' ? seriesId : '');
    let arrRecords = null;
    if (!Number.isFinite(arrId) || arrId <= 0) {
      arrRecords = await fetchJson(`${arrBase}/api/v3/${mediaType === 'tv' ? 'series' : 'movie'}?${arrApi}`);
      const match = tmdbId ? arrRecords.find((entry) => String(entry.tmdbId || '') === String(tmdbId)) : null;
      if (!match && tmdbId) {
        const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (arrRecords.some((entry) => normalize(entry.title) === normalize(title))) {
          return { status: 'unresolved', detail: `Could not confirm a ${mediaType === 'tv' ? 'Sonarr' : 'Radarr'} match by TMDb ID` };
        }
      }
      arrId = Number(match?.id || '');
    }
    if (!Number.isFinite(arrId) || arrId <= 0) {
      const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const titleCandidate = (arrRecords || []).some((entry) => normalize(entry.title) === normalize(title));
      return titleCandidate
        ? { status: 'unresolved', detail: `Could not confirm a ${mediaType === 'tv' ? 'Sonarr' : 'Radarr'} match by TMDb ID` }
        : { status: 'not-tracked', detail: `Not tracked in ${mediaType === 'tv' ? 'Sonarr' : 'Radarr'}` };
    }

    const bazarrBase = bazarr.url.replace(/\/$/, '');
    const path = mediaType === 'tv'
      ? `/api/episodes?${episodeId ? `episodeid%5B%5D=${encodeURIComponent(episodeId)}` : `seriesid%5B%5D=${encodeURIComponent(arrId)}`}`
      : `/api/movies?radarrid%5B%5D=${encodeURIComponent(arrId)}`;
    const payload = await fetchJson(`${bazarrBase}${path}`, { headers: { 'X-API-KEY': bazarr.apiKey } });
    const records = Array.isArray(payload?.data) ? payload.data : payload?.data && typeof payload.data === 'object' ? [payload.data] : [];
    if (!records.length) return { status: 'not-tracked', detail: 'No subtitle profile in Bazarr' };

    const missingFor = (record) => Array.isArray(record.missing_subtitles)
      ? record.missing_subtitles
      : record.missing_subtitles && typeof record.missing_subtitles === 'object' ? [record.missing_subtitles] : null;
    const subtitleRequirements = records.map(missingFor);
    if (subtitleRequirements.some((languages) => languages === null)) return { status: 'indexing', detail: 'Bazarr is still indexing subtitle status' };
    const knownRequirements = subtitleRequirements.map((languages) => languages || []);
    const missingRecords = knownRequirements.filter((languages) => languages.length > 0);
    const languages = [...new Set(missingRecords.flatMap((missing) => missing.map((language) => language.name || language.code2 || language.code3).filter(Boolean)))];
    if (!missingRecords.length) return { status: 'complete', detail: 'Subtitles complete for tracked languages', itemCount: records.length };
    const missingCount = missingRecords.reduce((count, missing) => count + missing.length, 0);
    const subject = mediaType === 'tv' ? `${missingRecords.length}/${records.length} episode${records.length === 1 ? '' : 's'} missing` : `${missingCount} subtitle${missingCount === 1 ? '' : 's'} missing`;
    return { status: 'missing', detail: [subject, languages.length ? languages.join(', ') : 'Language unavailable'].join(' · '), missingCount, itemCount: records.length, languages };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Request failed';
    return { status: 'unavailable', detail: `Bazarr lookup failed · ${reason}` };
  }
}

async function fetchJellyseerr(service) {
  if (!service?.url || !service.apiKey) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const headers = { 'X-Api-Key': service.apiKey };
  const pageSize = 100;
  const firstPage = await fetchJson(`${base}/api/v1/request?take=${pageSize}&skip=0&filter=all&sort=modified&sortDirection=desc`, { headers });
  const requests = [...(firstPage.results || firstPage.requests || [])];
  const total = Number(firstPage.pageInfo?.results || firstPage.pageInfo?.total || firstPage.total || requests.length);
  for (let skip = requests.length; skip < total; skip += pageSize) {
    const page = await fetchJson(`${base}/api/v1/request?take=${pageSize}&skip=${skip}&filter=all&sort=modified&sortDirection=desc`, { headers });
    const items = page.results || page.requests || [];
    requests.push(...items);
    if (!items.length) break;
  }
  // Jellyseerr request status differs from media availability status:
  // 1 pending, 2 approved, 3 declined, 4 failed, 5 completed.
  // Completed requests are presented as Available in this dashboard because
  // that is the user-facing state people need when browsing their library.
  const statusLabels = { 1: 'Pending', 2: 'Approved', 3: 'Declined', 4: 'Failed', 5: 'Available' };
  const resolved = await Promise.all(requests.map(async (item) => {
    const media = item.media || {};
    const reportedMediaType = String(media.mediaType || item.mediaType || 'movie').toLowerCase();
    const mediaType = reportedMediaType === 'tv' || reportedMediaType === 'series' ? 'tv' : 'movie';
    const tmdbId = media.tmdbId || '';
    const externalId = tmdbId || media.externalServiceId || media.id;
    let title = item.title || media.title || media.originalTitle || media.name || '';
    if (!title && externalId) {
      try {
        const detail = await fetchJson(`${base}/api/v1/${mediaType === 'tv' ? 'tv' : 'movie'}/${encodeURIComponent(externalId)}`, { headers });
        title = detail.title || detail.name || detail.original_title || detail.original_name || '';
      } catch { /* Keep the ID below if Jellyseerr cannot resolve a detail record. */ }
    }
    const createdAt = item.createdAt || item.updatedAt || '';
    const age = createdAt ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((new Date(createdAt).getTime() - Date.now()) / 86400000), 'day') : 'recently';
    return { requestId: item.id || item.requestId || '', tmdbId, externalId, mediaType, year: media.releaseDate ? String(media.releaseDate).slice(0, 4) : '', jellyseerrUrl: tmdbId ? `${base}/${mediaType === 'tv' ? 'tv' : 'movie'}/${encodeURIComponent(tmdbId)}` : `${base}/discover`, title: title || (externalId ? `Media ${externalId}` : 'Unknown media'), detail: mediaType === 'tv' ? 'Series' : 'Movie', requester: item.requestedBy?.displayName || item.requestedBy?.username || item.requestedBy?.plexUsername || 'Unknown user', state: statusLabels[item.status] || String(item.status || 'Pending'), age, createdAt: item.createdAt || '', updatedAt: item.updatedAt || '' };
  }));
  const tracked = observeRequestEvents(resolved);
  return { name: 'Jellyseerr', state: 'Healthy', detail: `${tracked.length} requests loaded`, requests: tracked };
}

async function fetchBazarr(service) {
  if (!service?.url || !service.apiKey) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const badges = await fetchJson(`${base}/api/badges`, { headers: { 'X-API-KEY': service.apiKey } });
  const episodes = Number(badges.episodes || 0);
  const movies = Number(badges.movies || 0);
  const providerIssues = Number(badges.providers || 0);
  const healthIssues = Number(badges.status || 0);
  const wanted = episodes + movies;
  const issues = providerIssues + healthIssues;
  const detail = [
    `${wanted} subtitle${wanted === 1 ? '' : 's'} wanted`,
    providerIssues ? `${providerIssues} provider issue${providerIssues === 1 ? '' : 's'}` : '',
    healthIssues ? `${healthIssues} health issue${healthIssues === 1 ? '' : 's'}` : ''
  ].filter(Boolean).join(' · ');
  return {
    name: 'Bazarr',
    state: issues ? 'Attention' : 'Healthy',
    detail: detail || 'Connected · no subtitles currently wanted',
    metrics: { wantedEpisodes: episodes, wantedMovies: movies, providerIssues, healthIssues }
  };
}

async function fetchSabnzbd(service) {
  if (!service?.url || !service.apiKey) throw new Error('Not configured');
  const payload = await fetchJson(`${service.url.replace(/\/$/, '')}/api?mode=queue&output=json&apikey=${encodeURIComponent(service.apiKey)}`);
  const slots = payload.queue?.slots || [];
  return { name: 'SABnzbd', state: 'Healthy', detail: `${slots.length} queued downloads`, pipeline: slots.map((item) => ({ title: item.filename || 'Unknown download', detail: item.cat || 'Download', service: 'SABnzbd', state: normalizeQueueState(item.status || 'Downloading'), progress: Number.parseFloat(stripPercentage(item.percentage)) || 0, openUrl: service.url.replace(/\/$/, '') })) };
}

async function fetchProwlarr(service) {
  if (!service?.url || !service.apiKey) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const options = { headers: { 'X-Api-Key': service.apiKey } };
  const [indexers, health] = await Promise.all([
    fetchJson(`${base}/api/v1/indexer`, options),
    fetchJson(`${base}/api/v1/health`, options)
  ]);
  const configuredIndexers = Array.isArray(indexers) ? indexers : [];
  const enabledIndexers = configuredIndexers.filter((indexer) => indexer.enable !== false).length;
  const issues = Array.isArray(health) ? health : [];
  return {
    name: 'Prowlarr',
    state: issues.length ? 'Attention' : 'Healthy',
    detail: `${enabledIndexers} enabled of ${configuredIndexers.length} indexers${issues.length ? ` · ${issues.length} health issue${issues.length === 1 ? '' : 's'}` : ''}`,
    metrics: { indexersTotal: configuredIndexers.length, indexersEnabled: enabledIndexers, healthIssues: issues.length }
  };
}

function tdarrNodeCount(payload) {
  const nodes = payload?.nodes || payload?.data?.nodes || payload?.data || payload;
  if (Array.isArray(nodes)) return nodes.length;
  return nodes && typeof nodes === 'object' ? Object.keys(nodes).length : undefined;
}

function tdarrWebLink(value) {
  try {
    const url = new URL(value);
    if (url.port === '8266') url.port = '8265';
    return url.toString().replace(/\/$/, '');
  } catch { return value; }
}

async function fetchTdarr(service) {
  if (!service?.url) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const headers = service.apiKey ? { 'x-api-key': service.apiKey } : {};
  const status = await fetchJson(`${base}/api/v2/status`, { headers });
  const nodesResult = await Promise.allSettled([
    fetchJson(`${base}/api/v2/get-nodes`, { headers }),
    fetchJson(`${base}/api/v2/cruddb`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { collection: 'StatisticsJSONDB', mode: 'getById', docID: 'statistics', obj: {} } })
    })
  ]);
  const nodes = nodesResult[0].status === 'fulfilled' ? tdarrNodeCount(nodesResult[0].value) : undefined;
  const statistics = nodesResult[1].status === 'fulfilled' ? (nodesResult[1].value?.data || nodesResult[1].value) : {};
  const queueMetrics = {
    transcodeQueued: statistics.table1ViewableCount ?? statistics.table1Count,
    transcodeErrors: statistics.table3ViewableCount ?? statistics.table3Count,
    healthCheckQueued: statistics.table4ViewableCount ?? statistics.table4Count,
    healthCheckErrors: statistics.table6ViewableCount ?? statistics.table6Count
  };
  const metrics = {
    ...(nodes !== undefined ? { tdarrNodes: nodes } : {}),
    ...Object.fromEntries(Object.entries(queueMetrics).filter(([, value]) => Number.isFinite(Number(value))).map(([key, value]) => [key, Number(value)]))
  };
  const queueDetail = [
    metrics.tdarrNodes !== undefined ? `${metrics.tdarrNodes} connected node${metrics.tdarrNodes === 1 ? '' : 's'}` : '',
    metrics.transcodeQueued !== undefined ? `${metrics.transcodeQueued} transcode queued` : '',
    metrics.transcodeErrors !== undefined ? `${metrics.transcodeErrors} transcode errors` : ''
  ].filter(Boolean).join(' · ');
  const version = status.version ? `v${status.version}` : 'Server reachable';
  return {
    name: 'Tdarr',
    state: String(status.status || '').toLowerCase() === 'good' ? 'Healthy' : 'Attention',
    detail: [version, queueDetail].filter(Boolean).join(' · '),
    metrics
  };
}

async function fetchCleanuparr(service) {
  if (!service?.url) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const headers = service.apiKey ? { 'X-Api-Key': service.apiKey } : {};
  const payload = await fetchJson(`${base}/api/v2/stats`, { headers });
  const stats = payload?.data || payload || {};
  const events = stats.events || {};
  const strikes = stats.strikes || {};
  const jobsByType = stats.jobs?.byType && typeof stats.jobs.byType === 'object' ? Object.values(stats.jobs.byType) : [];
  const jobRuns = jobsByType.reduce((total, job) => total + Number(job.totalRuns || job.total || 0), 0);
  const jobErrors = jobsByType.reduce((total, job) => total + Number(job.errors || job.failed || job.errorCount || (job.errorMessage ? 1 : 0)), 0);
  const timeframeHours = Number(events.timeframeHours || strikes.timeframeHours || 24);
  const removed = Number(strikes.itemsRemoved || 0);
  return {
    name: 'Cleanuparr',
    detail: `${removed} item${removed === 1 ? '' : 's'} removed · ${Number(events.totalCount || 0)} events in ${timeframeHours}h${jobRuns ? ` · ${jobRuns} job runs` : ''}${jobErrors ? ` · ${jobErrors} job error${jobErrors === 1 ? '' : 's'}` : ''}`,
    state: jobErrors ? 'Attention' : 'Healthy',
    metrics: { eventsTotal: Number(events.totalCount || 0), strikesTotal: Number(strikes.totalCount || 0), itemsRemoved: removed, jobRuns, jobErrors, timeframeHours }
  };
}

function wizarrList(payload, key) {
  if (Array.isArray(payload)) return payload;
  const candidates = [payload?.[key], payload?.data?.[key], payload?.data, payload?.items, payload?.results];
  return candidates.find(Array.isArray) || [];
}

function wizarrApiBase(service) {
  if (!service?.url || !service.apiKey) throw new Error('Wizarr URL and API key are required');
  return service.url.replace(/\/+$/, '').replace(/\/api$/i, '');
}

async function wizarrApiRequest(service, path, options = {}) {
  const base = wizarrApiBase(service);
  const method = options.method || 'GET';
  const headers = { Accept: 'application/json', 'X-API-Key': service.apiKey, ...(options.headers || {}) };
  const response = await fetch(`${base}/api${path}`, { ...options, headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Wizarr ${method} ${path} returned HTTP ${response.status}${message ? ` · ${message.slice(0, 240)}` : ''}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function fetchWizarr(service) {
  let health;
  try {
    health = await wizarrApiRequest(service, '/health');
  } catch (error) {
    if (!String(error?.message || '').includes('HTTP 404')) throw error;
    health = await wizarrApiRequest(service, '/status');
  }
  const [invitationPayload, userPayload] = await Promise.all([
    wizarrApiRequest(service, '/invitations'),
    wizarrApiRequest(service, '/users')
  ]);
  if (health?.status && !['ok', 'healthy', 'up'].includes(String(health.status).toLowerCase())) {
    throw new Error(`Wizarr health check reported ${health.status}`);
  }
  const invitations = wizarrList(invitationPayload, 'invitations');
  const users = wizarrList(userPayload, 'users');
  const now = Date.now();
  const availableInvitations = invitations.filter((invitation) => {
    if (invitation.used === true) return false;
    const expiry = invitation.expiresAt || invitation.expires_at;
    return !expiry || new Date(expiry).getTime() > now;
  }).length;
  const healthDetail = health?.version ? ` · v${health.version}` : '';
  return {
    name: 'Wizarr',
    state: 'Healthy',
    detail: `${users.length} users · ${availableInvitations} available invite${availableInvitations === 1 ? '' : 's'}${healthDetail}`,
    metrics: { usersTotal: users.length, invitationsTotal: invitations.length, invitationsAvailable: availableInvitations }
  };
}

async function getWizarrManagement(service) {
  const [userPayload, serverPayload, libraryPayload] = await Promise.all([
    wizarrApiRequest(service, '/users'),
    wizarrApiRequest(service, '/servers'),
    wizarrApiRequest(service, '/libraries').catch((error) => {
      if (String(error?.message || '').includes('HTTP 404')) return [];
      throw error;
    })
  ]);
  const servers = wizarrList(serverPayload, 'servers');
  const libraries = wizarrList(libraryPayload, 'libraries');
  const serverLibraries = servers.flatMap((server) => {
    const nested = [server.libraries, server.library_sections, server.sections].find(Array.isArray) || [];
    return nested.map((library) => ({ ...library, server_id: library.server_id ?? library.serverId ?? server.id }));
  });
  return {
    users: wizarrList(userPayload, 'users'),
    servers,
    libraries: libraries.length ? libraries : serverLibraries
  };
}

async function createWizarrInvitation(service, payload) {
  const invitation = await wizarrApiRequest(service, '/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wizarrInvitationBody(payload))
  });
  const created = invitation?.invitation || invitation || {};
  const url = wizarrInviteLink(created.url, service.publicUrl);
  return { ...invitation, invitation: { ...created, url }, url, publicUrlMissing: !url };
}

async function removeWizarrUser(service, userId) {
  if (!/^\d+$/.test(String(userId || ''))) throw new Error('Wizarr user ID must be numeric');
  return wizarrApiRequest(service, `/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

function stripPercentage(value) { return String(value || '').replace('%', ''); }

async function fetchQbittorrent(service) {
  if (!service?.url || !service.username || !service.password) throw new Error('Not configured');
  const base = service.url.replace(/\/$/, '');
  const login = await fetch(`${base}/api/v2/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: service.username, password: service.password }), signal: AbortSignal.timeout(7000) });
  if (!login.ok) throw new Error(`HTTP ${login.status}`);
  const cookie = login.headers.get('set-cookie') || '';
  const torrents = await fetchJson(`${base}/api/v2/torrents/info`, { headers: { Cookie: cookie } });
  return { name: 'qBittorrent', state: 'Healthy', detail: `${torrents.length} active torrents`, pipeline: torrents.map((item) => ({ title: item.name || 'Unknown download', detail: `${item.progress ? Math.round(item.progress * 100) : 0}% downloaded`, service: 'qBittorrent', state: ['stalledDL', 'stalledUP'].includes(item.state) ? 'Stalled' : normalizeQueueState(item.state), progress: Math.round((item.progress || 0) * 100), needsAction: ['stalledDL', 'error'].includes(item.state), openUrl: base, torrentHash: item.hash || '' })) };
}

function dockerName(value) {
  const name = String(value || '').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(name)) throw new Error('Invalid Docker container name');
  return name;
}

async function dockerCommand(args) {
  try { return (await execFileAsync('docker', args, { timeout: 7000, maxBuffer: 1024 * 1024 })).stdout; } catch (error) { throw new Error(error.code === 'ENOENT' ? 'Docker CLI is not available' : error.stderr?.trim() || error.message); }
}

async function fetchDocker(service) {
  if (!service?.enabled) throw new Error('Not configured');
  const raw = await dockerCommand(['ps', '-a', '--format', '{{json .}}']);
  const containers = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line)).map((item) => ({ id: item.ID, name: item.Names, image: item.Image, state: item.State, status: item.Status, ports: item.Ports }));
  return { name: 'Docker', state: 'Healthy', detail: `${containers.filter((item) => item.state === 'running').length} running · ${containers.length} containers`, containers };
}

async function dockerAction(service, action, container) {
  if (!service?.enabled) throw new Error('Docker is not enabled');
  const allowed = ['start', 'stop', 'restart'];
  if (!allowed.includes(action)) throw new Error('Unsupported Docker action');
  const name = dockerName(container);
  await dockerCommand([action, name]);
  return { ok: true, action, container: name };
}

async function dockerLogs(service, container, tail = 200) {
  if (!service?.enabled) throw new Error('Docker is not enabled');
  const name = dockerName(container);
  const limit = Math.min(1000, Math.max(1, Number(tail) || 200));
  return { ok: true, container: name, logs: await dockerCommand(['logs', '--tail', String(limit), name]) };
}

async function qbittorrentSession(service) {
  if (!service?.url || !service.username || !service.password) throw new Error('qBittorrent credentials are required');
  const base = service.url.replace(/\/$/, '');
  const login = await fetch(`${base}/api/v2/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: service.username, password: service.password }), signal: AbortSignal.timeout(7000) });
  if (!login.ok) throw new Error(`qBittorrent login returned ${login.status}`);
  const cookie = login.headers.get('set-cookie') || '';
  return (path, params) => fetch(`${base}/api/v2/${path}`, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params), signal: AbortSignal.timeout(7000) });
}

// After an import with importMode "move", this clears what is left of the torrent and stops seeding.
async function deleteQbittorrentTorrent(service, hash) {
  const response = await (await qbittorrentSession(service))('torrents/delete', { hashes: hash.toLowerCase(), deleteFiles: 'true' });
  if (!response.ok) throw new Error(`qBittorrent returned ${response.status}`);
}

// Import now: finish an import Radarr/Sonarr is waiting on for a complete download, then remove the download so it stops seeding.
// The download is only removed once the import command reports completed.
async function importArrNow(config, serviceName, queueId) {
  const service = serviceName === 'Sonarr' ? config.sonarr : config.radarr;
  if (!service?.url || !service.apiKey) throw new Error(`${serviceName} is not configured`);
  const base = service.url.replace(/\/$/, '');
  const api = `apiKey=${encodeURIComponent(service.apiKey)}`;
  const queue = await fetchJson(`${base}/api/v3/queue?page=1&pageSize=200&${api}`);
  const record = (queue.records || []).find((entry) => String(entry.id) === String(queueId));
  if (!record) throw new Error('This download is no longer in the queue');
  if (!canImportNow(record)) throw new Error('Only a finished download that is waiting on import can be imported now');
  const candidates = await fetchJson(`${base}/api/v3/manualimport?downloadId=${encodeURIComponent(record.downloadId)}&filterExistingFiles=false&${api}`);
  const files = manualImportFiles(serviceName, candidates, record);
  const started = await fetch(`${base}/api/v3/command?${api}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: 'ManualImport', importMode: 'move', files }), signal: AbortSignal.timeout(7000) });
  if (!started.ok) throw new Error(`${serviceName} returned ${started.status} when starting the import`);
  const command = await started.json();
  let status = command.status;
  let message = '';
  // ponytail: polls for 60 s; a huge copy across disks can take longer, in which case the download is kept and the item stays.
  for (let attempt = 0; attempt < 60 && !['completed', 'failed', 'aborted', 'cancelled'].includes(status); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const current = await fetchJson(`${base}/api/v3/command/${encodeURIComponent(command.id)}?${api}`);
    status = current.status;
    message = current.message || current.exception || '';
  }
  if (status !== 'completed') throw new Error(status === 'failed' ? `${serviceName} could not import: ${message || 'see its logs'}. The download was kept.` : `${serviceName} is still importing. The download was kept; check back in a minute.`);
  let removedFromClient = false;
  if (record.protocol === 'torrent' && /qbittorrent/i.test(record.downloadClient || '') && config.qbittorrent?.url) {
    await deleteQbittorrentTorrent(config.qbittorrent, record.downloadId);
    removedFromClient = true;
  }
  return { ok: true, service: serviceName, imported: files.length, removedFromClient };
}

const serviceTestAdapters = {
  plex: ['Plex', (config) => fetchPlex(config)],
  tautulli: ['Tautulli', (config) => fetchTautulli(config)],
  jellyseerr: ['Jellyseerr', (config) => fetchJellyseerr(config.jellyseerr)],
  wizarr: ['Wizarr', (config) => fetchWizarr(config.wizarr)],
  cleanuparr: ['Cleanuparr', (config) => fetchCleanuparr(config.cleanuparr)],
  tdarr: ['Tdarr', (config) => fetchTdarr(config.tdarr)],
  prowlarr: ['Prowlarr', (config) => fetchProwlarr(config.prowlarr)],
  bazarr: ['Bazarr', (config) => fetchBazarr(config.bazarr)],
  sonarr: ['Sonarr', (config) => fetchArrQueue(config.sonarr, 'Sonarr')],
  radarr: ['Radarr', (config) => fetchArrQueue(config.radarr, 'Radarr')],
  qbittorrent: ['qBittorrent', (config) => fetchQbittorrent(config.qbittorrent)],
  sabnzbd: ['SABnzbd', (config) => fetchSabnzbd(config.sabnzbd)],
  unraid: ['Unraid', (config) => fetchUnraid(config.unraid)],
  tmdb: ['TMDb', (config) => fetchTmdb(config)],
  omdb: ['OMDb', (config) => fetchOmdb(config)]
};

function resolveServiceTestKey(name) {
  const normalizedName = String(name || '').split(' · ')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return Object.keys(serviceTestAdapters).find((key) => key.toLowerCase() === normalizedName)
    || Object.keys(serviceTestAdapters).find((key) => serviceTestAdapters[key][0].toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName);
}

function applyServiceTestDraft(name, config, draft) {
  const configKey = resolveServiceTestKey(name);
  if (!configKey) throw new Error(`Unknown service: ${name || '(empty name)'}`);
  const allowedFields = new Set(['url', 'apiKey', 'token', 'username', 'password']);
  const safeDraft = Object.fromEntries(Object.entries(draft && typeof draft === 'object' ? draft : {}).filter(([key, value]) => allowedFields.has(key) && typeof value === 'string'));

  config[configKey] = { ...(config[configKey] || {}), ...safeDraft };
  return config;
}

async function testConfiguredService(name, config, draft = {}) {
  config = applyServiceTestDraft(name, config, draft);
  const configKey = resolveServiceTestKey(name);
  const data = await serviceTestAdapters[configKey][1](config);
  return { ok: true, name, state: data.state || 'Healthy', detail: data.detail || 'Connection successful' };
}

async function fetchUnraid(service) {
  if (!service?.url || !service.apiKey) throw new Error('Not configured');
  const query = `query { info { os { uptime } } array { state capacity { kilobytes { free used total } } disks { name size status temp } } }`;
  const response = await fetch(`${service.url.replace(/\/$/, '')}/graphql`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': service.apiKey }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Unraid returned ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors[0].message || 'Unraid GraphQL error');
  const info = payload.data?.info?.os || {};
  const array = payload.data?.array || {};
  const capacity = array.capacity?.kilobytes || {};
  const freeStorage = formatCapacityKilobytes(capacity.free);
  const usedStorage = formatCapacityKilobytes(capacity.used);
  const totalStorage = formatCapacityKilobytes(capacity.total);
  const uptime = formatUptime(info.uptime);
  const state = String(array.state || '').toLowerCase();
  return { name: 'Unraid', state: state && !['started', 'healthy', 'active'].includes(state) ? 'Attention' : 'Healthy', detail: [array.state ? `Array ${array.state}` : 'Array status unavailable', freeStorage ? `${freeStorage} free` : null, uptime].filter(Boolean).join(' · '), freeStorage, uptime, metrics: { freeStorage, usedStorage, totalStorage, disks: (array.disks || []).map((disk) => ({ name: disk.name, size: formatCapacityKilobytes(disk.size), status: disk.status, temperature: disk.temp })) } };
}

async function getDashboard() {
  const now = Date.now();
  if (dashboardInFlight) return dashboardInFlight;
  if (dashboardCache && now - dashboardCacheAt < dashboardCacheTtlMs) return { ...dashboardCache, freshness: { ...(dashboardCache.freshness || {}), ageSeconds: Math.round((now - dashboardCacheAt) / 1000), strategy: 'cached parallel adapter refresh' } };
  dashboardInFlight = refreshDashboard().then((dashboard) => {
    dashboardCache = dashboard;
    dashboardCacheAt = Date.now();
    return dashboard;
  }).finally(() => { dashboardInFlight = null; });
  return dashboardInFlight;
}

async function refreshDashboard() {
  const config = readConfig();
  if (config.demoMode) {
    const dashboard = createDemoDashboard(config.demoProfile);
    dashboard.activity = collectActivity(dashboard.requests, dashboard.pipeline, dashboard.services);
    dashboard.alerts = collectAlerts(dashboard.pipeline, dashboard.services);
    return dashboard;
  }

  const services = [];
  const serviceRoot = (service) => service?.url ? service.url.replace(/\/$/, '') : '';
  const memory = process.memoryUsage();
  const result = { mode: 'live', generatedAt: new Date().toISOString(), runtime: { host: serviceHostname(config.unraid.url), processUptime: Math.round(process.uptime()), processMemory: Math.round(memory.rss / 1024 / 1024), hostMemory: { total: Math.round(os.totalmem() / 1024 / 1024), free: Math.round(os.freemem() / 1024 / 1024), used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024) }, loadAverage: os.loadavg(), cpuCount: os.cpus().length }, links: { plex: serviceRoot(config.plex) ? `${serviceRoot(config.plex)}/web/index.html#!/` : '', tautulli: serviceRoot(config.tautulli), jellyseerr: serviceRoot(config.jellyseerr), wizarr: serviceRoot(config.wizarr), cleanuparr: serviceRoot(config.cleanuparr), tdarr: tdarrWebLink(serviceRoot(config.tdarr)), prowlarr: serviceRoot(config.prowlarr), bazarr: serviceRoot(config.bazarr), sonarr: serviceRoot(config.sonarr) ? `${serviceRoot(config.sonarr)}/series` : '', radarr: serviceRoot(config.radarr) ? `${serviceRoot(config.radarr)}/movie` : '', qbittorrent: serviceRoot(config.qbittorrent), sabnzbd: serviceRoot(config.sabnzbd), unraid: serviceRoot(config.unraid) }, health: { label: 'Waiting for live data', online: 0, total: 0, freeStorage: null }, streams: [], pipeline: [], requests: [], requestedMedia: [], missingMedia: [], media: [], allMedia: [], analytics: { history: [], summary: { plays: 0, users: 0, totalMinutes: 0 } }, services: [], activity: [], alerts: [] };
  const plexStartedAt = Date.now();
  try {
    result.streams = await fetchPlex(config);
    services.push({ name: 'Plex', state: 'Healthy', detail: `${result.streams.length} active streams`, checkedAt: new Date().toISOString(), latencyMs: Date.now() - plexStartedAt, source: 'Plex' });
  } catch (error) {
    const configured = Boolean(config.plex.url && config.plex.token);
    services.push({ name: 'Plex', state: configured ? 'Offline' : 'Not configured', detail: configured ? error.message : unconfiguredServiceDetail, checkedAt: new Date().toISOString(), latencyMs: Date.now() - plexStartedAt, source: 'Plex' });
  }
  const tautulliStartedAt = Date.now();
  try {
    const [sessions, analytics] = await Promise.all([fetchTautulli(config), fetchTautulliAnalytics(config).catch(() => ({ history: [], summary: { plays: 0, users: 0, totalMinutes: 0 } }))]);
    result.analytics = analytics;
    if (!result.streams.length) result.streams = sessions.map((session) => ({ server: session.server_name || 'Tautulli', user: session.user || 'Unknown user', title: session.full_title || session.title || 'Unknown media', ratingKey: session.rating_key || session.ratingKey || '', grandparentRatingKey: session.grandparent_rating_key || session.grandparentRatingKey || '', quality: session.video_resolution || 'Unknown', mode: session.transcode_decision === 'transcode' ? 'Transcoding' : session.transcode_decision === 'directstream' ? 'Direct Stream' : 'Direct Play', device: session.player || session.platform || 'Unknown device', client: session.product || 'Unknown client', videoCodec: session.video_codec || 'Unknown', audioCodec: session.audio_codec || 'Unknown', bandwidth: Number(session.bandwidth || 0), duration: Number(session.duration || 0), progress: Number(session.percent_complete || 0) }));
    services.push({ name: 'Tautulli', state: 'Healthy', detail: `${sessions.length} active sessions`, checkedAt: new Date().toISOString(), latencyMs: Date.now() - tautulliStartedAt, source: 'Tautulli' });
  } catch (error) {
    const configured = Boolean(config.tautulli.url && config.tautulli.apiKey);
    services.push({ name: 'Tautulli', state: configured ? 'Offline' : 'Not configured', detail: configured ? error.message : unconfiguredServiceDetail, checkedAt: new Date().toISOString(), latencyMs: Date.now() - tautulliStartedAt, source: 'Tautulli' });
  }
  const libraryStartedAt = Date.now();
  try {
    const library = await fetchPlexLibrary(config);
    result.media = library.items;
    result.allMedia = library.allItems;
    services.push({ name: 'Plex library', state: library.allItems.length || library.items.length ? 'Healthy' : 'Attention', detail: library.allItems.length || library.items.length ? `${library.allItems.length} available media items · ${library.items.length} recently added` : `${library.sections} libraries found, no items returned`, checkedAt: new Date().toISOString(), latencyMs: Date.now() - libraryStartedAt, source: 'Plex' });
  } catch (error) {
    const configured = Boolean(config.plex.url && config.plex.token);
    services.push({ name: 'Plex library', state: configured ? 'Attention' : 'Not configured', detail: configured ? error.message : unconfiguredServiceDetail, checkedAt: new Date().toISOString(), latencyMs: Date.now() - libraryStartedAt, source: 'Plex' });
  }
  if (!result.media.length) {
    try {
      result.media = await fetchTautulliRecentMedia(config);
      const libraryService = services.find((service) => service.name === 'Plex library');
      if (libraryService && result.media.length) { libraryService.state = 'Healthy'; libraryService.detail = `${result.media.length} recent media items via Tautulli`; }
    } catch { /* Tautulli may not expose recent media on every installation. */ }
  }
  const adapters = [
    ['Jellyseerr', () => fetchJellyseerr(config.jellyseerr), Boolean(config.jellyseerr?.url && config.jellyseerr?.apiKey)],
    ['Wizarr', () => fetchWizarr(config.wizarr), Boolean(config.wizarr?.url && config.wizarr?.apiKey)],
    ['Cleanuparr', () => fetchCleanuparr(config.cleanuparr), Boolean(config.cleanuparr?.url)],
    ['Tdarr', () => fetchTdarr(config.tdarr), Boolean(config.tdarr?.url)],
    ['Prowlarr', () => fetchProwlarr(config.prowlarr), Boolean(config.prowlarr?.url && config.prowlarr?.apiKey)],
    ['Bazarr', () => fetchBazarr(config.bazarr), Boolean(config.bazarr?.url && config.bazarr?.apiKey)],
    ['qBittorrent', () => fetchQbittorrent(config.qbittorrent), Boolean(config.qbittorrent?.url && config.qbittorrent?.username && config.qbittorrent?.password)],
    ['SABnzbd', () => fetchSabnzbd(config.sabnzbd), Boolean(config.sabnzbd?.url && config.sabnzbd?.apiKey)],
    ['Unraid', () => fetchUnraid(config.unraid), Boolean(config.unraid?.url && config.unraid?.apiKey)],
    ['TMDb', () => fetchTmdb(config), Boolean(config.tmdb?.apiKey)],
    ['OMDb', () => fetchOmdb(config), Boolean(config.omdb?.apiKey)]
  ];
  adapters.push(['Sonarr', () => fetchArrQueue(config.sonarr, 'Sonarr'), Boolean(config.sonarr?.url && config.sonarr?.apiKey)]);
  adapters.push(['Radarr', () => fetchArrQueue(config.radarr, 'Radarr'), Boolean(config.radarr?.url && config.radarr?.apiKey)]);
  if (config.docker.enabled) adapters.push(['Docker', () => fetchDocker(config.docker), true]);
  const adapterResults = await Promise.all(adapters.map(async ([serviceName, adapter, configured]) => {
    const startedAt = Date.now();
    try {
      return { serviceName, configured, data: await adapter(), latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString() };
    } catch (error) {
      return { serviceName, configured, error, latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString() };
    }
  }));
  for (const { serviceName, configured, data, error, latencyMs, checkedAt } of adapterResults) {
    if (data) {
      services.push({ name: data.name, service: data.name, state: data.state, detail: data.detail, metrics: data.metrics, containers: data.containers, checkedAt, latencyMs, source: serviceName });
      if (data.freeStorage) result.health.freeStorage = data.freeStorage;
      if (data.uptime) result.runtime.uptime = data.uptime;
      if (data.pipeline) result.pipeline.push(...data.pipeline);
      if (data.requests) result.requests.push(...data.requests);
      if (data.requests) result.requestedMedia.push(...data.requests.map((item) => ({ title: item.title, detail: item.state, type: item.detail, library: 'Jellyseerr', state: item.state, requester: item.requester, age: item.age })));
      if (data.missing) result.missingMedia.push(...data.missing);
    } else {
      const state = configured ? 'Offline' : 'Not configured';
      services.push({ name: serviceName, state, detail: configured ? error.message : unconfiguredServiceDetail, checkedAt, latencyMs, source: serviceName });
    }
  }
  result.pipeline = observePipelineEvents(result.pipeline);
  result.requests = result.requests.map((request) => {
    const matches = result.pipeline.filter((item) => request.tmdbId && item.tmdbId && String(item.tmdbId) === String(request.tmdbId) && item.mediaType === request.mediaType);
    return { ...request, pipelineItems: matches, pipelineState: matches[0]?.state || '' };
  });
  result.pipeline = result.pipeline.map((item) => {
    const request = result.requests.find((candidate) => candidate.tmdbId && item.tmdbId && String(candidate.tmdbId) === String(item.tmdbId) && candidate.mediaType === item.mediaType);
    return request ? { ...item, requestId: request.requestId, requestTitle: request.title } : item;
  });
  result.pipeline.sort((a, b) => Number(Boolean(b.needsAction)) - Number(Boolean(a.needsAction)));
  result.pipeline = result.pipeline.slice(0, 24);
  result.services = observeServiceEvents(services).map((service) => ({ ...service, freshness: { checkedAt: service.checkedAt || result.generatedAt, ageSeconds: Math.max(0, Math.round((Date.now() - new Date(service.checkedAt || result.generatedAt).getTime()) / 1000)) } }));
  result.freshness = { generatedAt: result.generatedAt, ageSeconds: 0, strategy: 'parallel adapter refresh' };
  result.health = { ...result.health, ...stackHealth(services) };
  result.activity = collectActivity(result.requests, result.pipeline, result.services);
  result.alerts = collectAlerts(result.pipeline, result.services);
  const previousAlertIds = new Set((dashboardCache?.alerts || []).map((alert) => alert.id));
  for (const alert of result.alerts.filter((item) => !item.resolved && !previousAlertIds.has(item.id))) sendNotification(config, { type: 'alert', title: alert.title, detail: alert.detail, severity: alert.severity, relatedId: alert.relatedId }).catch(() => {});
  return result;
}

async function actionQbittorrent(service, action, hash) {
  if (!hash) throw new Error('qBittorrent credentials and torrent hash are required');
  return controlTorrent(await qbittorrentSession(service), action, hash);
}

async function searchArr(service, serviceName, id) {
  if (!service?.url || !service.apiKey || !id) throw new Error(`${serviceName} URL, API key, and media id are required`);
  const command = serviceName === 'Sonarr' ? { name: 'SeriesSearch', seriesId: Number(id) } : { name: 'MoviesSearch', movieIds: [Number(id)] };
  const response = await fetch(`${service.url.replace(/\/$/, '')}/api/v3/command?apiKey=${encodeURIComponent(service.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`${serviceName} returned ${response.status}`);
  return { ok: true, action: 'search', service: serviceName, id: Number(id) };
}

async function searchSonarrAvailability(service, seriesId, scope, seasonNumber, episodeId) {
  if (!service?.url || !service.apiKey || !seriesId) throw new Error('Sonarr URL, API key, and series ID are required');
  let command;
  if (scope === 'episode' && episodeId) command = { name: 'EpisodeSearch', episodeIds: [Number(episodeId)] };
  else if (scope === 'season' && seasonNumber != null) command = { name: 'SeasonSearch', seriesId: Number(seriesId), seasonNumber: Number(seasonNumber) };
  else if (scope === 'series') command = { name: 'SeriesSearch', seriesId: Number(seriesId) };
  else throw new Error('A valid Sonarr search scope is required');
  const response = await fetch(`${service.url.replace(/\/$/, '')}/api/v3/command?apiKey=${encodeURIComponent(service.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Sonarr returned ${response.status}`);
  return { ok: true, scope, command: command.name };
}

async function createJellyseerrRequest(service, mediaType, tmdbId) {
  const mediaId = Number(tmdbId);
  if (!service?.url || !service.apiKey) throw new Error('Jellyseerr URL and API key are required');
  if (!Number.isSafeInteger(mediaId) || mediaId <= 0 || !['movie', 'tv'].includes(mediaType)) throw new Error('A valid TMDb id and media type are required');
  const response = await fetch(`${service.url.replace(/\/$/, '')}/api/v1/request`, {
    method: 'POST',
    headers: { 'X-Api-Key': service.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ mediaType, mediaId, ...(mediaType === 'tv' ? { seasons: 'all' } : {}), is4k: false }),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.error || `Jellyseerr returned ${response.status}`);
  dashboardCache = null;
  dashboardCacheAt = 0;
  return { ok: true, requestId: result.id || result.requestId || '', status: result.status || 'Pending' };
}

async function manageJellyseerrRequest(service, requestId, action) {
  if (!service?.url || !service.apiKey) throw new Error('Jellyseerr URL and API key are required');
  if (!/^\d+$/.test(String(requestId)) || !['approve', 'decline'].includes(action)) throw new Error('A valid request ID and action are required');
  const response = await fetch(`${service.url.replace(/\/$/, '')}/api/v1/request/${encodeURIComponent(requestId)}/${action}`, {
    method: 'POST',
    headers: { 'X-Api-Key': service.apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.error || `Jellyseerr returned ${response.status}`);
  dashboardCache = null;
  dashboardCacheAt = 0;
  return { ok: true, requestId: String(requestId), action };
}

async function blocklistArr(service, serviceName, queueId) {
  if (!service?.url || !service.apiKey || !queueId) throw new Error(`${serviceName} URL, API key and queue id are required`);
  const response = await fetch(`${service.url.replace(/\/$/, '')}/api/v3/queue/${encodeURIComponent(queueId)}?removeFromClient=true&blocklist=true&apiKey=${encodeURIComponent(service.apiKey)}`, { method: 'DELETE', signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`${serviceName} returned ${response.status}`);
  return { ok: true, action: 'blocklist', service: serviceName, queueId: Number(queueId) };
}

function calendarIcs(calendar) {
  const escape = (value) => String(value || '').replace(/[\\;,]/g, (character) => `\\${character}`).replace(/\n/g, '\\n');
  const events = calendar.entries.filter((entry) => entry.date).map((entry) => {
    const date = new Date(entry.date);
    const stamp = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    return ['BEGIN:VEVENT', `UID:${escape(`${entry.service}-${entry.sourceId || entry.title}-${entry.date}`)}`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, `SUMMARY:${escape(entry.title)}`, `DESCRIPTION:${escape(`${entry.detail} · ${entry.service}`)}`, 'END:VEVENT'].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Orchestrarr//Calendar//EN', ...events, 'END:VCALENDAR', ''].join('\r\n');
}

function resolveAlert(id, action = 'resolved') {
  if (!id) throw new Error('Alert id is required');
  const resolutions = readResolutions();
  if (action === 'unresolved') delete resolutions[id];
  else resolutions[id] = { action, at: new Date().toISOString() };
  writeResolutions(resolutions);
  return { ok: true, id, action };
}

async function sendNotification(config, event) {
  if (!config.notifications.webhookUrl) return { ok: false, skipped: true, reason: 'No webhook configured' };
  const response = await fetch(config.notifications.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ source: 'orchestrarr', sentAt: new Date().toISOString(), event }), signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Notification webhook returned ${response.status}`);
  return { ok: true };
}

function cookieValue(request, name) {
  const cookies = request.headers.cookie || '';
  return cookies.split(';').map((part) => part.trim().split('=')).find(([key]) => key === name)?.[1] || '';
}

function requestCredentials(request) {
  return { authorization: request.headers.authorization, apiKeyHeader: request.headers['x-orchestrarr-key'], hasSession: authSessions.has(cookieValue(request, 'orchestrarr_session')) };
}

function webhookService(request) {
  return request.url?.match(/^\/api\/webhooks\/(plex|radarr|sonarr)(?:\?|$)/)?.[1] || '';
}

function webhookSecret(request) {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  return request.headers['x-orchestrarr-webhook-secret'] || url.searchParams.get('secret') || '';
}

function webhookSecretAccepted(request, config) {
  const expected = String(config.webhooks?.secret || '');
  if (!expected) return config.auth.mode === 'none';
  const provided = Buffer.from(String(webhookSecret(request)));
  const target = Buffer.from(expected);
  return provided.length === target.length && provided.length > 0 && timingSafeEqual(provided, target);
}

function requiresAuth(request, config) {
  if (!request.url?.startsWith('/api/') || request.url.startsWith('/api/health') || request.url.startsWith('/api/auth/') || webhookService(request)) return false;
  return !credentialsAccepted(config.auth, requestCredentials(request));
}

function serviceHostname(value) {
  try {
    return value ? new URL(value).hostname || os.hostname() : os.hostname();
  } catch {
    return os.hostname();
  }
}

function authAttemptAllowed(request) {
  const key = request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const previous = authAttempts.get(key) || { startedAt: now, count: 0 };
  if (now - previous.startedAt > 300000) { authAttempts.set(key, { startedAt: now, count: 1 }); return true; }
  previous.count += 1;
  authAttempts.set(key, previous);
  return previous.count <= 10;
}

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(payload));
}

async function serveArtwork(request, response) {
  const match = request.url?.match(/^\/api\/media\/([^/]+)\/artwork$/);
  if (!match) return false;
  const config = readConfig();
  const ratingKey = decodeURIComponent(match[1]);
  if (!config.plex.url || !config.plex.token) { response.writeHead(404); response.end(); return true; }
  const base = config.plex.url.replace(/\/$/, '');
  const token = encodeURIComponent(config.plex.token);
  const thumbPath = `/library/metadata/${encodeURIComponent(ratingKey)}/thumb`;
  // Originals are ~1MB; Plex's photo transcoder returns a ~20KB poster at 2x card size. Fall back to the original if it refuses.
  let artwork = await fetch(`${base}/photo/:/transcode?width=320&height=480&minSize=1&upscale=1&url=${encodeURIComponent(thumbPath)}&X-Plex-Token=${token}`, { signal: AbortSignal.timeout(7000) }).catch(() => null);
  if (!artwork?.ok) artwork = await fetch(`${base}${thumbPath}?X-Plex-Token=${token}`, { signal: AbortSignal.timeout(7000) });
  if (!artwork.ok) { response.writeHead(404); response.end(); return true; }
  response.writeHead(200, { 'Content-Type': artwork.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
  response.end(Buffer.from(await artwork.arrayBuffer()));
  return true;
}

async function serveDiscoveryArtwork(request, response) {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const path = url.searchParams.get('path') || '';
  const size = url.searchParams.get('size') || 'w780';
  if (!/^\/[A-Za-z0-9_./-]+$/.test(path) || !path.includes('.') || !['w342', 'w780'].includes(size)) { response.writeHead(400); response.end(); return true; }
  const localMatch = path.match(/^\/demo\/posters\/([a-z0-9_]+)\.png$/);
  if (localMatch) {
    const localPath = join(root, 'public', 'demo', 'posters', localMatch[1] + '.png');
    if (!existsSync(localPath)) { response.writeHead(404); response.end(); return true; }
    response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
    response.end(readFileSync(localPath));
    return true;
  }
  const artwork = await fetch('https://image.tmdb.org/t/p/' + size + path, { signal: AbortSignal.timeout(7000) });
  if (!artwork.ok) { response.writeHead(404); response.end(); return true; }
  response.writeHead(200, { 'Content-Type': artwork.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' });
  response.end(Buffer.from(await artwork.arrayBuffer()));
  return true;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
    if (!sameOriginWriteAllowed(request)) { json(response, 403, { error: 'CSRF check failed' }); return; }
    const authConfig = readConfig();
    if (request.method === 'POST' && request.url?.startsWith('/api/webhooks/')) {
      const serviceName = webhookService(request);
      if (!serviceName) { json(response, 404, { error: 'Unsupported webhook service' }); return; }
      if (!webhookSecretAccepted(request, authConfig)) { json(response, 401, { error: 'Webhook authentication required' }); return; }
    }
    if (request.url === '/api/auth/status' && request.method === 'GET') { const authenticated = credentialsAccepted(authConfig.auth, requestCredentials(request)); json(response, 200, { mode: authConfig.auth.mode, authenticated }); return; }
    if (request.url === '/api/auth/login' && request.method === 'POST') { if (!authAttemptAllowed(request)) { json(response, 429, { error: 'Too many authentication attempts' }); return; } const body = JSON.parse(await readBody(request) || '{}'); if (authConfig.auth.mode !== 'apikey' || !authConfig.auth.apiKey || body.key !== authConfig.auth.apiKey) { json(response, 401, { error: 'Invalid access key' }); return; } const session = randomUUID(); authSessions.add(session); response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': `orchestrarr_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`, 'Cache-Control': 'no-store' }); response.end(JSON.stringify({ ok: true })); return; }
    if (request.url === '/api/auth/logout' && request.method === 'POST') { const session = cookieValue(request, 'orchestrarr_session'); authSessions.delete(session); response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': 'orchestrarr_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' }); response.end(JSON.stringify({ ok: true })); return; }
    if (requiresAuth(request, authConfig)) { json(response, 401, { error: 'Authentication required' }); return; }
    if (authConfig.demoMode) {
      const demoUrl = new URL(request.url || '/', 'http://' + (request.headers.host || 'localhost'));
      const demoType = demoUrl.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      if (demoUrl.pathname === '/api/wizarr/management' && request.method === 'GET') { json(response, 200, demoWizarrManagement(authConfig.demoProfile)); return; }
      if (demoUrl.pathname === '/api/wizarr/invitations' && request.method === 'POST') {
        const code = 'DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        json(response, 201, { invitation: { code, url: '', status: 'available', expires: new Date(Date.now() + 7 * 86400000).toISOString() }, url: '', demo: true });
        return;
      }
      if (demoUrl.pathname.startsWith('/api/wizarr/users/') && request.method === 'DELETE') { json(response, 200, { ok: true, demo: true }); return; }
      if (demoUrl.pathname === '/api/discovery/detail' && request.method === 'GET') { json(response, 200, demoTitleDetails(demoUrl.searchParams.get('id') || '', demoType)); return; }
      if (demoUrl.pathname === '/api/discovery' && request.method === 'GET') { json(response, 200, demoDiscovery(demoUrl.searchParams.get('q') || '', demoUrl.searchParams.get('page') || 1, authConfig.demoProfile)); return; }
      if (demoUrl.pathname === '/api/calendar' && request.method === 'GET') { json(response, 200, demoCalendar(demoUrl.searchParams.get('from') || '', demoUrl.searchParams.get('to') || '', authConfig.demoProfile)); return; }
      if (demoUrl.pathname === '/api/calendar.ics' && request.method === 'GET') {
        const calendar = demoCalendar(demoUrl.searchParams.get('from') || '', demoUrl.searchParams.get('to') || '', authConfig.demoProfile);
        response.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="orchestrarr.ics"', 'Cache-Control': 'no-store' });
        response.end(calendarIcs(calendar));
        return;
      }
      if (demoUrl.pathname === '/api/analytics' && request.method === 'GET') { json(response, 200, (await getDashboard()).analytics); return; }
      if (demoUrl.pathname === '/api/series/availability' && request.method === 'GET') { json(response, 200, demoSeriesAvailability(demoUrl.searchParams.get('tmdbId') || '', demoUrl.searchParams.get('title') || '', authConfig.demoProfile)); return; }
      if (demoUrl.pathname === '/api/series/episode-detail' && request.method === 'GET') { json(response, 200, demoEpisodeDetails(demoUrl.searchParams.get('tmdbId') || '', Number(demoUrl.searchParams.get('seasonNumber')), Number(demoUrl.searchParams.get('episodeNumber')))); return; }
      if (demoUrl.pathname === '/api/plex/library-match' && request.method === 'GET') { json(response, 200, demoPlexLibraryMatch(demoUrl.searchParams.get('tmdbId') || '', demoUrl.searchParams.get('title') || '', authConfig.demoProfile)); return; }
      if (demoUrl.pathname === '/api/arr/media-match' && request.method === 'GET') { json(response, 200, demoArrMediaMatch(demoUrl.searchParams.get('tmdbId') || '', demoType, demoUrl.searchParams.get('title') || '', authConfig.demoProfile)); return; }
      if (demoUrl.pathname === '/api/plex/media-context' && request.method === 'GET') { json(response, 200, demoMediaContext(demoUrl.searchParams.get('ratingKey') || '')); return; }
      if (demoUrl.pathname === '/api/tautulli/title-history' && request.method === 'GET') { json(response, 200, { history: demoTitleHistory(demoUrl.searchParams.get('tmdbId') || '', demoUrl.searchParams.get('title') || '', authConfig.demoProfile) }); return; }
      if (demoUrl.pathname === '/api/ratings' && request.method === 'GET') { json(response, 200, demoRatings(demoUrl.searchParams.get('tmdbId') || '')); return; }
      if (demoUrl.pathname === '/api/bazarr/media-status' && request.method === 'GET') { json(response, 200, demoBazarrMediaStatus(demoUrl.searchParams.get('tmdbId') || '', demoType)); return; }
    }
    if (request.url === '/api/health') { json(response, 200, { ok: true, service: 'orchestrarr', mode: readConfig().demoMode ? 'demo' : 'live' }); return; }
    if (request.url === '/api/events' && request.method === 'GET') { response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }); response.write(': connected\n\n'); eventClients.add(response); request.on('close', () => eventClients.delete(response)); return; }
    if (request.url === '/api/dashboard') { json(response, 200, await getDashboard()); return; }
    if (request.url === '/api/services') { json(response, 200, (await getDashboard()).services); return; }
    if (request.url === '/api/wizarr/management' && request.method === 'GET') { json(response, 200, await getWizarrManagement(readConfig().wizarr)); return; }
    if (request.url === '/api/wizarr/invitations' && request.method === 'POST') { const body = JSON.parse(await readBody(request) || '{}'); json(response, 201, await createWizarrInvitation(readConfig().wizarr, body)); return; }
    const wizarrDeleteMatch = request.url?.match(/^\/api\/wizarr\/users\/([^/?]+)$/);
    if (wizarrDeleteMatch && request.method === 'DELETE') { json(response, 200, await removeWizarrUser(readConfig().wizarr, decodeURIComponent(wizarrDeleteMatch[1]))); return; }
    if (request.url?.startsWith('/api/series/availability') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchSeriesAvailability(readConfig(), url.searchParams.get('tmdbId') || '', url.searchParams.get('title') || '')); return; }
    if (request.url?.startsWith('/api/bazarr/media-status') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchBazarrMediaStatus(readConfig(), url.searchParams.get('type') === 'tv' ? 'tv' : 'movie', url.searchParams.get('tmdbId') || '', url.searchParams.get('title') || '', url.searchParams.get('seriesId') || '', url.searchParams.get('episodeId') || '')); return; }
    if (request.url?.startsWith('/api/series/episode-detail') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchEpisodeDetails(readConfig(), url.searchParams.get('tmdbId') || '', Number(url.searchParams.get('seasonNumber')), Number(url.searchParams.get('episodeNumber')))); return; }
    if (request.url?.startsWith('/api/plex/library-match') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchPlexLibraryMatch(readConfig(), url.searchParams.get('type') === 'tv' ? 'tv' : 'movie', url.searchParams.get('tmdbId') || '', url.searchParams.get('title') || '')); return; }
    if (request.url?.startsWith('/api/arr/media-match') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchArrMediaMatch(readConfig(), url.searchParams.get('type') === 'tv' ? 'tv' : 'movie', url.searchParams.get('tmdbId') || '', url.searchParams.get('title') || '')); return; }
    if (request.url?.startsWith('/api/plex/media-context') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const ratingKey = url.searchParams.get('ratingKey') || ''; if (!ratingKey) { json(response, 400, { error: 'Plex rating key is required' }); return; } json(response, 200, await fetchPlexMediaContext(readConfig(), ratingKey)); return; }
    if (request.url?.startsWith('/api/tautulli/title-history') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, { history: await fetchTautulliTitleHistory(readConfig(), url.searchParams.get('type') === 'tv' ? 'tv' : 'movie', url.searchParams.get('title') || '', url.searchParams.get('ratingKey') || '') }); return; }
    if (request.url === '/api/refresh' && request.method === 'POST') { json(response, 200, await getDashboard()); return; }
    if (request.url?.startsWith('/api/actions/resume-qbittorrent') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await actionQbittorrent(readConfig().qbittorrent, 'resume', url.searchParams.get('hash') || '')); return; }
    if (request.url?.startsWith('/api/actions/pause-qbittorrent') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await actionQbittorrent(readConfig().qbittorrent, 'pause', url.searchParams.get('hash') || '')); return; }
    if (request.url?.startsWith('/api/actions/search-arr') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const config = readConfig(); const serviceName = url.searchParams.get('service') === 'Sonarr' ? 'Sonarr' : 'Radarr'; const service = serviceName === 'Sonarr' ? config.sonarr : config.radarr; json(response, 200, await searchArr(service, serviceName, url.searchParams.get('id') || '')); return; }
    if (request.url?.startsWith('/api/actions/search-sonarr-availability') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await searchSonarrAvailability(readConfig().sonarr, url.searchParams.get('seriesId') || '', url.searchParams.get('scope') || '', url.searchParams.get('seasonNumber'), url.searchParams.get('episodeId'))); return; }
    if (request.url === '/api/actions/request-jellyseerr' && request.method === 'POST') { const body = JSON.parse(await readBody(request) || '{}'); json(response, 201, await createJellyseerrRequest(readConfig().jellyseerr, body.mediaType, body.tmdbId)); return; }
    if (request.url?.startsWith('/api/actions/jellyseerr-request') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await manageJellyseerrRequest(readConfig().jellyseerr, url.searchParams.get('id') || '', url.searchParams.get('action') || '')); return; }
    if (request.url?.startsWith('/api/actions/import-arr') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const serviceName = url.searchParams.get('service') === 'Sonarr' ? 'Sonarr' : 'Radarr'; json(response, 200, await importArrNow(readConfig(), serviceName, url.searchParams.get('id') || '')); return; }
    if (request.url?.startsWith('/api/actions/blocklist-arr') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const config = readConfig(); const serviceName = url.searchParams.get('service') === 'Sonarr' ? 'Sonarr' : 'Radarr'; const service = serviceName === 'Sonarr' ? config.sonarr : config.radarr; json(response, 200, await blocklistArr(service, serviceName, url.searchParams.get('id') || '')); return; }
    if (request.url?.startsWith('/api/docker/logs') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await dockerLogs(readConfig().docker, url.searchParams.get('container') || '', url.searchParams.get('tail') || '200')); return; }
    if (request.url?.startsWith('/api/docker/') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const match = url.pathname.match(/^\/api\/docker\/(start|stop|restart)$/); if (!match) throw new Error('Unsupported Docker action'); json(response, 200, await dockerAction(readConfig().docker, match[1], url.searchParams.get('container') || '')); return; }
    if (request.url?.startsWith('/api/ratings') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const tmdbId = url.searchParams.get('tmdbId') || ''; if (!tmdbId) { json(response, 400, { error: 'A TMDb ID is required' }); return; } json(response, 200, await fetchRatings(readConfig(), url.searchParams.get('type') === 'tv' ? 'tv' : 'movie', tmdbId)); return; }
    if (request.url?.startsWith('/api/discovery/detail') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const type = url.searchParams.get('type') === 'tv' ? 'tv' : 'movie'; const config = readConfig(); json(response, 200, { ...(await tmdbRequest(config, `/${type}/${encodeURIComponent(url.searchParams.get('id') || '')}`, { append_to_response: 'credits' })), media_type: type }); return; }
    if (request.url?.startsWith('/api/discovery') && !request.url?.startsWith('/api/discovery-artwork') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchDiscovery(readConfig(), url.searchParams.get('q') || '', Number(url.searchParams.get('page') || 0))); return; }
    if (request.url?.startsWith('/api/calendar') && !request.url?.startsWith('/api/calendar.ics') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, await fetchCalendar(readConfig(), url.searchParams.get('from') || '', url.searchParams.get('to') || '')); return; }
    if (request.url?.startsWith('/api/calendar.ics') && request.method === 'GET') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const calendar = await fetchCalendar(readConfig(), url.searchParams.get('from') || '', url.searchParams.get('to') || ''); response.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="orchestrarr.ics"', 'Cache-Control': 'no-store' }); response.end(calendarIcs(calendar)); return; }
    if (request.url === '/api/analytics' && request.method === 'GET') { json(response, 200, (await getDashboard()).analytics || { history: [], summary: { plays: 0, users: 0, totalMinutes: 0 } }); return; }
    if (request.url === '/api/notifications/test' && request.method === 'POST') { json(response, 200, await sendNotification(readConfig(), { type: 'test', title: 'Orchestrarr notification test', detail: 'The configured webhook is reachable.' })); return; }
    if (request.url?.startsWith('/api/actions/resolve') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); json(response, 200, resolveAlert(url.searchParams.get('id') || '', url.searchParams.get('action') || 'resolved')); return; }
    if (request.url?.startsWith('/api/test-service') && request.method === 'POST') { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); const body = JSON.parse(await readBody(request) || '{}'); const settings = body && typeof body === 'object' ? body.settings || {} : {}; json(response, 200, await testConfiguredService(url.searchParams.get('name') || '', readConfig(), settings)); return; }
    if (request.url?.startsWith('/api/webhooks/') && request.method === 'POST') { const serviceName = webhookService(request); const raw = await readBody(request); let payload = {}; try { payload = request.headers['content-type']?.includes('application/json') ? JSON.parse(raw || '{}') : JSON.parse(new URLSearchParams(raw).get('payload') || '{}'); } catch { throw new Error('Webhook payload must be valid JSON'); } const event = recordWebhookEvent(serviceName, payload); broadcastEvent({ type: 'webhook', service: serviceName, ...event }); json(response, 202, event); return; }
    if (request.url === '/api/config' && request.method === 'GET') { const config = readConfig(); json(response, 200, { demoMode: config.demoMode, demoProfile: normalizeDemoProfile(config.demoProfile), authMode: config.auth.mode, auth: { mode: config.auth.mode, apiKeySet: Boolean(config.auth.apiKey), username: config.auth.username, passwordSet: Boolean(config.auth.password || config.auth.passwordHash), managedByEnv: Object.keys(authEnv).filter((key) => process.env[authEnv[key]]) }, notificationsConfigured: Boolean(config.notifications.webhookUrl), services: serviceConfigStatus(config) }); return; }
    if (request.url === '/api/config' && request.method === 'PUT') { const raw = await readBody(request); const result = updateConfig(JSON.parse(raw || '{}')); json(response, result.ok ? 200 : 400, result); return; }
    if (request.url?.startsWith('/api/discovery-artwork') && request.method === 'GET') { if (await serveDiscoveryArtwork(request, response)) return; }
    if (await serveArtwork(request, response)) return;
    serveStatic(request, response, join(root, 'dist'));
  } catch (error) { json(response, 500, { error: error.message }); }
});

prepareApiKey();
server.listen(port, host, () => console.log(`Orchestrarr listening on http://${host}:${server.address().port}`));
