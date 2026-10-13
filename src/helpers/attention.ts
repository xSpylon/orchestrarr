import type { ActivityItem, DashboardItem } from '@/types/dashboard.types';
import { pipelineStateLabel, statusShape, type StatusShape } from './format.ts';

// The server raises an alert for every pipeline item that needs action, so alerts are the full list.
// Pipeline alerts are swapped for their pipeline item, which carries the retry and blocklist actions.
export function attentionItems(alerts: ActivityItem[], pipeline: DashboardItem[]): DashboardItem[] {
  const pipelineByAlertId = new Map(pipeline.map((item) => [`pipeline-${item.service}-${item.sourceId || item.title}`, item]));
  return alerts.filter((alert) => !alert.resolved).map((alert) => pipelineByAlertId.get(String(alert.id)) || {
    ...alert,
    state: alert.severity ? `${alert.severity[0].toUpperCase()}${alert.severity.slice(1)}` : 'Alert',
    needsAction: false,
  });
}

// Sonarr/Radarr can report "Import pending" for an import that is stuck on a warning; the server's needsAction
// flag knows the difference, so it wins over the state text. Sidebar, Overview and Pipeline then agree.
export function pipelineShape(item: DashboardItem): StatusShape {
  return item.needsAction ? 'attention' : statusShape(pipelineStateLabel(item.state));
}
