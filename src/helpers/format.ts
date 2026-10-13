export function statusTone(state?: unknown): 'good' | 'warn' | 'bad' {
  const value = String(state || '').toLowerCase();
  if ([
    'healthy', 'all services online', 'available', 'approved', 'requested', 'searching', 'direct play',
    'transcoding', 'downloading', 'queued', 'importing', 'idle', 'reachable',
    'completed', 'checking', 'seeding', 'online', 'connected',
  ].includes(value)) return 'good';
  if ([
    'attention', 'attention required', 'pending', 'stalled', 'paused', 'processing', 'import pending',
    'import blocked', 'missing', 'waiting', 'waiting for live data', 'connecting', 'degraded', 'fetching metadata', 'stopped seeding',
  ].includes(value)) return 'warn';
  return 'bad';
}

export function formatTime(value?: string | number, now = new Date()): string {
  if (value === undefined || value === null || value === '') return 'Unavailable';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }) });
}

export function displayText(value: string): string {
  return value.replace(/&(?:#x([\da-f]+)|#(\d+)|(amp|quot|apos|lt|gt|nbsp));/gi, (entity, hex: string | undefined, decimal: string | undefined, name: string | undefined) => {
    if (hex || decimal) {
      const codePoint = Number.parseInt(hex || decimal || '', hex ? 16 : 10);
      return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    }
    const named: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' };
    return named[String(name).toLowerCase()] || entity;
  });
}

export function formatMegabytes(value?: number): string {
  if (value == null || !Number.isFinite(Number(value))) return 'Unavailable';
  return value >= 1024 ? `${(value / 1024).toFixed(1)} GB` : `${Math.round(value)} MB`;
}

export function mediaTypeLabel(detail?: unknown): string {
  const word = String(detail || '').trim().split(/\s+/)[0];
  return word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : 'Media';
}

export function formatMinutes(value?: number): string {
  if (value == null || !Number.isFinite(Number(value))) return 'Unavailable';
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

const pipelineStates: Record<string, string> = { metaDL: 'Fetching metadata', stoppedUP: 'Stopped seeding' };
export function pipelineStateLabel(state?: string): string | undefined {
  return state ? pipelineStates[state] || state : state;
}

export type StatusShape = 'done' | 'progress' | 'pending' | 'attention' | 'failed';
const statusShapes: Record<StatusShape, string[]> = {
  done: ['available', 'completed', 'healthy', 'approved', 'seeding', 'stopped seeding', 'connected', 'online', 'reachable', 'all services online'],
  progress: ['downloading', 'importing', 'searching', 'processing', 'transcoding', 'direct play', 'fetching metadata', 'checking'],
  pending: ['pending', 'requested', 'queued', 'waiting', 'paused', 'import pending', 'idle', 'connecting', 'waiting for live data', 'not configured'],
  attention: ['attention', 'attention required', 'import blocked', 'stalled', 'missing', 'degraded'],
  failed: [],
};
/** Status icon shape. Unconfigured services are neutral; unknown states still read as failed. */
export function statusShape(state?: unknown): StatusShape {
  const value = String(state || '').toLowerCase();
  return (Object.keys(statusShapes) as StatusShape[]).find((shape) => statusShapes[shape].includes(value)) || 'failed';
}

export function dayGroupLabel(value?: string | number, now = new Date()): string {
  if (value === undefined || value === null || value === '') return 'Earlier';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (date.getFullYear() !== now.getFullYear()) return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
}

export function formatClock(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Stream bandwidth arrives in kbps from Plex and Tautulli. */
export function formatBandwidth(kbps: number): string {
  if (kbps > 0 && kbps < 1000) return `${Math.round(kbps)} kbps`;
  const mbps = kbps / 1000;
  return `${mbps >= 100 ? Math.round(mbps) : Number(mbps.toFixed(1))} Mbps`;
}

export function formatVotes(count: number): string {
  if (count >= 1_000_000) return `${Number((count / 1_000_000).toFixed(1))}M`;
  if (count >= 10_000) return `${Math.round(count / 1000)}k`;
  if (count >= 1000) return `${Number((count / 1000).toFixed(1))}k`;
  return String(count);
}
