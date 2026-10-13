import { statusShape, type StatusShape } from '@/helpers/format';

const RING = 2 * Math.PI * 2.5;

/** 14px status glyph: dashed = waiting, pie = in progress (fills with real progress), check = done, bang = attention, cross = failed. */
/** `shape` overrides the one read from the state text, e.g. an "Import pending" the server flags as needing action. */
export function StatusIcon({ state, progress, shape: shapeOverride }: { state?: unknown; progress?: number; shape?: StatusShape }) {
  const shape = shapeOverride || statusShape(state);
  const fraction = Math.min(1, Math.max(0.12, (progress ?? 50) / 100));
  return <svg className={`status-icon ${shape}`} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    {shape === 'pending' ? <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.4 1.9" /> : null}
    {shape === 'progress' ? <><circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={`${fraction * RING} ${RING}`} transform="rotate(-90 7 7)" /></> : null}
    {shape === 'attention' ? <><circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M7 4.2v3.4M7 9.6v.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></> : null}
    {shape === 'done' ? <><circle cx="7" cy="7" r="6.25" fill="currentColor" /><path d="m4.6 7.1 1.7 1.7 3.2-3.4" fill="none" stroke="var(--background-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {shape === 'failed' ? <><circle cx="7" cy="7" r="6.25" fill="currentColor" /><path d="m5 5 4 4M9 5 5 9" stroke="var(--background-primary)" strokeWidth="1.5" strokeLinecap="round" /></> : null}
  </svg>;
}
