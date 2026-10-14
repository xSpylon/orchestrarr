// Demo actions change the visitor's own copy of the demo data. Changes live in memory per visitor: nothing is written to disk,
// nothing reaches a service, and in a public demo one visitor's approvals never show up for another.

const requestStates = { approve: 'Approved', decline: 'Declined' };
// The demo checklist: which of these the visitor has done so far.
const tourSteps = { request: 'requested', approve: 'approved', decline: 'declined', import: 'imported', pause: 'paused', blocklist: 'blocklisted', invite: 'invited', remove: 'removed' };
const pipelineChanges = {
  blocklist: { state: 'Searching', progress: 0, needsAction: false, importAction: false, blocklistAction: false, retryAction: '' },
  pause: { state: 'Paused' },
  resume: { state: 'Downloading' },
  search: { state: 'Searching', progress: 0, needsAction: false },
};

export function createDemoActions({ maxSessions = 500, maxChanges = 200 } = {}) {
  const sessions = new Map();

  function session(id, create) {
    let current = sessions.get(id);
    if (!current && !create) return null;
    // re-inserting keeps the Map in least-recently-used order, so the oldest visitor is dropped first
    sessions.delete(id);
    current ||= { requests: new Map(), pipeline: new Map(), added: [], resolved: new Set(), removedUsers: new Set(), tour: new Set(), changes: 0 };
    sessions.set(id, current);
    if (sessions.size > maxSessions) sessions.delete(sessions.keys().next().value);
    return current;
  }

  function required(value, name) {
    if (!value) throw new Error(`${name} is required`);
    return String(value);
  }

  function act(id, action, params = {}) {
    if (!requestStates[action] && !pipelineChanges[action] && !['import', 'request', 'resolve', 'invite', 'remove'].includes(action)) throw new Error(`Unsupported demo action: ${action}`);
    const visitor = session(id, true);
    if (++visitor.changes > maxChanges) throw new Error('This demo session has reached its change limit. Reload later to start fresh.');
    const at = new Date().toISOString();
    if (action === 'remove') visitor.removedUsers.add(required(params.userId, 'User id'));
    if (tourSteps[action]) visitor.tour.add(tourSteps[action]);
    if (action === 'invite' || action === 'remove') return { ok: true, demo: true };
    if (requestStates[action]) {
      const requestId = required(params.requestId, 'Request id');
      visitor.requests.set(requestId, { state: requestStates[action], at });
      return { ok: true, demo: true, requestId, state: requestStates[action] };
    }
    if (action === 'request') {
      const tmdbId = required(params.tmdbId, 'TMDb id');
      const existing = visitor.added.find((item) => item.tmdbId === tmdbId);
      if (existing) return { ok: true, demo: true, requestId: existing.requestId };
      const requestId = `demo-${tmdbId}`;
      visitor.added.unshift({ title: params.title || 'Requested title', requester: 'You', state: 'Pending', detail: params.detail || (params.mediaType === 'tv' ? 'Series' : 'Movie'), age: 'Just now', requestId, externalId: requestId, tmdbId, mediaType: params.mediaType === 'tv' ? 'tv' : 'movie', updated: at, createdAt: at, events: [{ title: 'Request received', detail: 'You requested this title', source: 'Jellyseerr', at, type: 'created' }] });
      return { ok: true, demo: true, requestId };
    }
    if (action === 'resolve') {
      const alertId = required(params.id, 'Alert id');
      if (params.action === 'unresolved') visitor.resolved.delete(alertId); else visitor.resolved.add(alertId);
      return { ok: true, demo: true, id: alertId, action: params.action || 'resolved' };
    }
    const key = action === 'pause' || action === 'resume' ? `hash:${required(params.torrentHash, 'Torrent hash')}`
      : action === 'search' ? `action:${params.service}:${required(params.actionId, 'Media id')}`
        : `queue:${params.service}:${required(params.queueId, 'Queue id')}`;
    visitor.pipeline.set(key, action === 'import' ? null : { ...(visitor.pipeline.get(key) || {}), ...pipelineChanges[action] });
    return action === 'import' ? { ok: true, demo: true, imported: 1, removedFromClient: true } : { ok: true, demo: true };
  }

  function apply(id, dashboard) {
    const visitor = session(id, false);
    if (!visitor) return dashboard;
    const changed = (item) => {
      const change = visitor.requests.get(String(item.requestId));
      return change ? { ...item, state: change.state, updated: change.at, events: [...(item.events || []), { title: change.state, detail: `${change.state} in the demo`, source: 'Jellyseerr', at: change.at, type: change.state.toLowerCase() }] } : item;
    };
    const pipeline = (dashboard.pipeline || []).flatMap((item) => {
      const keys = [`queue:${item.service}:${item.queueId}`, `hash:${item.torrentHash}`, `action:${item.service}:${item.actionId}`];
      if (keys.some((key) => visitor.pipeline.get(key) === null)) return [];
      return [Object.assign({}, item, ...keys.map((key) => visitor.pipeline.get(key)).filter(Boolean))];
    });
    const demoTour = Object.fromEntries(Object.values(tourSteps).map((step) => [step, visitor.tour.has(step)]));
    return { ...dashboard, demoTour, requests: [...visitor.added, ...(dashboard.requests || [])].map(changed), pipeline };
  }

  function applyAccess(id, management) {
    const visitor = session(id, false);
    if (!visitor?.removedUsers.size) return management;
    return { ...management, users: (management.users || []).filter((user) => !visitor.removedUsers.has(String(user.id))) };
  }

  return { act, apply, applyAccess, resolved: (id, alertId) => Boolean(sessions.get(id)?.resolved.has(alertId)) };
}
