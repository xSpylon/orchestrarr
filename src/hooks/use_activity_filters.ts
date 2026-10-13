import { useMemo, useState } from 'react';
import type { DashboardData, ActivityItem } from '@/types/dashboard.types';
import { dayGroupLabel } from '@/helpers/format';

const STEP = 40;
const NONE: ActivityItem[] = [];

/** Alerts/all tab (mirrored into ?filter=all), the filter chips, and the "show more" limit. */
export function useActivityFilters(dashboard: DashboardData) {
  const [filter, setFilter] = useState(new URLSearchParams(location.search).get('filter') === 'all' ? 'all' : 'alerts');
  const [service, setService] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [type, setType] = useState('all');
  const [time, setTime] = useState('all');
  const [mediaQuery, setMediaQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(STEP);
  const events = dashboard.activity || NONE;
  const alerts = dashboard.alerts || NONE;
  // "Last 24 hours" counts back from the dashboard snapshot, so filtering stays pure between refreshes.
  const now = new Date(dashboard.generatedAt || 0).getTime();
  const services = [...new Set([...events, ...alerts].map((item) => item.service).filter((item): item is string => Boolean(item)))].sort();
  const types = [...new Set(events.map((item) => item.type).filter((item): item is string => Boolean(item)))].sort();
  const filtered = useMemo(() => {
    const source = filter === 'alerts' ? alerts.filter((item) => !item.resolved).map((item) => ({ ...item, at: item.updatedAt, type: 'alert' })) : events;
    const cutoff = time === '24h' ? now - 86_400_000 : time === '7d' ? now - 604_800_000 : 0;
    return source.filter((item) => (service === 'all' || item.service === service) && (severity === 'all' || item.severity === severity) && (type === 'all' || item.type === type) && (!cutoff || new Date(item.at || item.updatedAt || 0).getTime() >= cutoff) && (!mediaQuery.trim() || `${item.title} ${item.detail || ''}`.toLowerCase().includes(mediaQuery.trim().toLowerCase())));
  }, [alerts, events, filter, mediaQuery, now, service, severity, time, type]);
  const visible = filtered.slice(0, visibleLimit);
  const days = [...visible.reduce((map, item) => {
    const day = dayGroupLabel(item.at || item.updatedAt);
    return map.set(day, [...(map.get(day) || []), item]);
  }, new Map<string, ActivityItem[]>())];
  return {
    filter, service, severity, type, time, mediaQuery, services, types, filtered, visible, days,
    alertCount: alerts.filter((item) => !item.resolved).length,
    eventCount: events.length,
    setService, setSeverity, setType, setTime, setMediaQuery,
    setFilter: (value: string) => { setFilter(value); window.history.replaceState({ ...(window.history.state || {}), view: 'activity' }, '', value === 'all' ? '/activity?filter=all' : '/activity'); },
    showMore: () => setVisibleLimit((limit) => limit + STEP),
  };
}

export type ActivityFilterState = ReturnType<typeof useActivityFilters>;
