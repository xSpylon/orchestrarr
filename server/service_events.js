// A service without credentials is a deliberate choice, not a fault: it never raises an alert or counts against health.
export const problemStates = ['Offline', 'Attention'];

export function stackHealth(services) {
  const configured = services.filter((service) => service.state !== 'Not configured');
  return {
    online: configured.filter((service) => service.state === 'Healthy').length,
    total: configured.length,
    label: configured.some((service) => problemStates.includes(service.state)) ? 'Attention required' : 'All systems nominal'
  };
}

// Service status only becomes an event when it changes, so a long-running problem keeps its original time.
// A healthy first sighting is stored silently as a baseline instead of flooding the log on first run.
export function nextServiceHistory(history, service, observedAt) {
  const previous = history[history.length - 1];
  if (previous?.state === service.state) return history;
  if (!previous && !problemStates.includes(service.state)) return [{ type: 'baseline', state: service.state, at: observedAt, silent: true }];
  return [...history, {
    type: 'service_status',
    title: `${service.name}: ${service.state}`,
    detail: service.detail || '',
    source: service.name,
    state: service.state,
    at: observedAt
  }].slice(-50);
}
