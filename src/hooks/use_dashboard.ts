import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { DashboardData } from '@/types/dashboard.types';

type DashboardState = {
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: (notify?: boolean) => Promise<void>;
};

export function useDashboard(autoRefresh: boolean, onNotify: (message: string) => void, enabled = true): DashboardState {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const notifyRef = useRef(onNotify);
  useEffect(() => { notifyRef.current = onNotify; });

  const refresh = useCallback(async (notify = false) => {
    const currentRequest = ++requestId.current;
    try {
      const nextDashboard = await apiRequest<DashboardData>('/api/dashboard');
      if (currentRequest !== requestId.current) return;
      setDashboard(nextDashboard);
      setError(null);
      if (notify) notifyRef.current(`Dashboard refreshed · ${nextDashboard.mode || 'live'} data`);
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      const message = cause instanceof Error ? cause.message : 'The dashboard API did not respond.';
      setError(message);
      if (notify) notifyRef.current(`Could not refresh dashboard · ${message}`);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return undefined;
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, enabled, refresh]);

  useEffect(() => {
    if (!enabled || !('EventSource' in window)) return undefined;
    const events = new EventSource('/api/events');
    events.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; service?: string };
        if (payload.type === 'webhook') {
          notifyRef.current(`${payload.service || 'Service'} event received`);
          void refresh();
        }
      } catch {
        // A malformed event should not interrupt dashboard updates.
      }
    };
    return () => events.close();
  }, [enabled, refresh]);

  return { dashboard, loading, error, refresh };
}
