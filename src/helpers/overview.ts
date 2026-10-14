type HasState = { state?: string };

const unavailable = /offline|unreachable|failed|error|not configured|unauthorized/i;

/** Healthy by its own report, and nothing in the state says otherwise. */
export function isReachable(service?: HasState) {
  return Boolean(service && /healthy|online|connected|ready/i.test(service.state || '') && !unavailable.test(service.state || ''));
}

/** Down or failing; a service nobody configured is not counted as offline. */
export function isOffline(service: HasState) {
  return unavailable.test(service.state || '') && !/not configured/i.test(service.state || '');
}
