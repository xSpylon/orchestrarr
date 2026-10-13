import type { DashboardItem } from '@/types/dashboard.types';
import { formatTime } from './format.ts';

/** The label/value rows the detail drawer shows for a service, an alert, or a pipeline/request item. */
export function itemDetailFields(item: DashboardItem): Array<[string, unknown]> {
  const fields: Array<[string, unknown]> = item.name
    ? [['Status', item.state], ['Details', item.detail], ['Source', item.source || item.name], ['Last checked', item.checkedAt ? formatTime(String(item.checkedAt)) : '—'], ['Latency', item.latencyMs != null ? `${item.latencyMs} ms` : '—'], ['Freshness', item.freshness && typeof item.freshness === 'object' && 'ageSeconds' in item.freshness ? `${String(item.freshness.ageSeconds)}s old` : '—'], ['Metrics', item.metrics ? JSON.stringify(item.metrics, null, 2) : '—']]
    : item.resolved !== undefined
      ? [['Severity', item.severity || 'attention'], ['State', item.state || '—'], ['Explanation', item.detail || '—'], ['Related service', item.service || 'Orchestrarr'], ['Related item', item.relatedId || '—'], ['Resolution', item.resolved ? 'Dismissed' : 'Open'], ['Updated', item.updatedAt ? formatTime(String(item.updatedAt)) : '—']]
      : [['Status', item.state], ['Service', item.service || item.server], ['Details', item.detail], ['Progress', item.progress != null ? `${item.progress}%` : '—'], ['Requester', item.requester], ['Age', item.age]];
  // Empty rows only show when the item names its service.
  return fields.filter(([, value]) => value !== '—' || item.service);
}
