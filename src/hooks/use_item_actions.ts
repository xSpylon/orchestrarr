import { useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import type { DashboardItem } from '@/types/dashboard.types';

/** Pipeline, alert, Docker and service actions, each confirmed where it is destructive and followed by a refresh. */
export function useItemActions(refresh: () => Promise<unknown>, showToast: (message: string) => void) {
  const { t } = useLocale();
  const performAction = useCallback(async (action: string, item: DashboardItem) => {
    try {
      if (action.startsWith('docker-')) {
        const [dockerAction, container] = action.slice(7).split(':');
        await apiRequest(`/api/docker/${dockerAction}?container=${encodeURIComponent(container)}`, { method: 'POST' });
        showToast(t(`actions.docker.${dockerAction}`, undefined, { container })); await refresh(); return;
      }
      if (action === 'resolve') {
        const id = String(item.id || item.relatedId || `pipeline-${item.service}-${item.sourceId || item.title}`);
        await apiRequest(`/api/actions/resolve?id=${encodeURIComponent(id)}`, { method: 'POST' });
        showToast(t('actions.issueDismissed')); await refresh(); return;
      }
      if (action === 'pause' || action === 'resume') {
        if (!item.torrentHash) throw new Error(t('actions.noPauseControls'));
        if (!window.confirm(t(action === 'pause' ? 'actions.confirmPause' : 'actions.confirmResume', undefined, { title: String(item.title) }))) return;
        await apiRequest(`/api/actions/${action}-qbittorrent?hash=${encodeURIComponent(item.torrentHash)}`, { method: 'POST' });
        showToast(t(action === 'pause' ? 'actions.downloadPaused' : 'actions.downloadResumed')); await refresh(); return;
      }
      if (action === 'import') {
        if (!item.queueId || !window.confirm(t('actions.confirmImport', undefined, { title: String(item.title), service: String(item.service) }))) return;
        const result = await apiRequest<{ imported: number; removedFromClient: boolean }>(`/api/actions/import-arr?service=${encodeURIComponent(item.service || '')}&id=${encodeURIComponent(String(item.queueId))}`, { method: 'POST' });
        showToast(t(result.removedFromClient ? 'actions.importedRemoved' : 'actions.imported', undefined, { title: String(item.title) })); await refresh(); return;
      }
      if (action === 'blocklist') {
        if (!item.queueId || !window.confirm(t('actions.confirmBlocklist', undefined, { title: String(item.title), service: String(item.service) }))) return;
        await apiRequest(`/api/actions/blocklist-arr?service=${encodeURIComponent(item.service || '')}&id=${encodeURIComponent(String(item.queueId))}`, { method: 'POST' });
        showToast(t('actions.blocklisted', undefined, { title: String(item.title) })); await refresh(); return;
      }
      if (item.retryAction === 'search' && item.actionId) {
        await apiRequest(`/api/actions/search-arr?service=${encodeURIComponent(item.service || '')}&id=${encodeURIComponent(String(item.actionId))}`, { method: 'POST' });
        showToast(t('actions.searchStarted', undefined, { service: String(item.service) })); await refresh(); return;
      }
      if (item.openUrl) { window.open(item.openUrl, '_blank', 'noopener,noreferrer'); return; }
      showToast(t('actions.noSourceLink'));
    } catch (cause) { showToast(t('actions.actionFailed', undefined, { reason: cause instanceof Error ? cause.message : t('common.requestFailed') })); }
  }, [refresh, showToast, t]);

  const testService = useCallback(async (name: string, settings: Record<string, string>) => {
    try { const result = await apiRequest<{ name: string }>(`/api/test-service?name=${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify({ settings }) }); showToast(t('actions.connectionOk', undefined, { name: result.name })); }
    catch (cause) { showToast(t('actions.connectionFailed', undefined, { reason: cause instanceof Error ? cause.message : t('common.requestFailed') })); }
  }, [showToast, t]);

  return { performAction, testService };
}
