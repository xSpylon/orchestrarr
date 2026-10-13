import { useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import type { DashboardItem } from '@/types/dashboard.types';

/** Pipeline, alert, Docker and service actions, each confirmed where it is destructive and followed by a refresh. */
export function useItemActions(refresh: () => Promise<unknown>, showToast: (message: string) => void) {
  const performAction = useCallback(async (action: string, item: DashboardItem) => {
    try {
      if (action.startsWith('docker-')) {
        const [dockerAction, container] = action.slice(7).split(':');
        await apiRequest(`/api/docker/${dockerAction}?container=${encodeURIComponent(container)}`, { method: 'POST' });
        showToast(`${container}: ${dockerAction} requested`); await refresh(); return;
      }
      if (action === 'resolve') {
        const id = String(item.id || item.relatedId || `pipeline-${item.service}-${item.sourceId || item.title}`);
        await apiRequest(`/api/actions/resolve?id=${encodeURIComponent(id)}`, { method: 'POST' });
        showToast('Issue dismissed'); await refresh(); return;
      }
      if (action === 'pause' || action === 'resume') {
        if (!item.torrentHash) throw new Error('This service does not expose pause controls');
        if (!window.confirm(`${action === 'pause' ? 'Pause' : 'Resume'} “${item.title}”?`)) return;
        await apiRequest(`/api/actions/${action}-qbittorrent?hash=${encodeURIComponent(item.torrentHash)}`, { method: 'POST' });
        showToast(`qBittorrent download ${action}d`); await refresh(); return;
      }
      if (action === 'import') {
        if (!item.queueId || !window.confirm(`Import “${item.title}” into ${item.service} now?\n\nThe files are moved into your library, then the finished download is removed from the download client, so it stops seeding.`)) return;
        const result = await apiRequest<{ imported: number; removedFromClient: boolean }>(`/api/actions/import-arr?service=${encodeURIComponent(item.service || '')}&id=${encodeURIComponent(String(item.queueId))}`, { method: 'POST' });
        showToast(`${item.title} imported${result.removedFromClient ? ' · download removed' : ''}`); await refresh(); return;
      }
      if (action === 'blocklist') {
        if (!item.queueId || !window.confirm(`Blocklist “${item.title}”?\n\nThis removes the download and its files from the download client, blocks this release, and ${item.service} searches for another one.`)) return;
        await apiRequest(`/api/actions/blocklist-arr?service=${encodeURIComponent(item.service || '')}&id=${encodeURIComponent(String(item.queueId))}`, { method: 'POST' });
        showToast(`${item.title} moved to blocklist`); await refresh(); return;
      }
      if (item.retryAction === 'search' && item.actionId) {
        await apiRequest(`/api/actions/search-arr?service=${encodeURIComponent(item.service || '')}&id=${encodeURIComponent(String(item.actionId))}`, { method: 'POST' });
        showToast(`Search started in ${item.service}`); await refresh(); return;
      }
      if (item.openUrl) { window.open(item.openUrl, '_blank', 'noopener,noreferrer'); return; }
      showToast('No source service link is available for this item');
    } catch (cause) { showToast(`Action failed · ${cause instanceof Error ? cause.message : 'Request failed'}`); }
  }, [refresh, showToast]);

  const testService = useCallback(async (name: string, settings: Record<string, string>) => {
    try { const result = await apiRequest<{ name: string }>(`/api/test-service?name=${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify({ settings }) }); showToast(`${result.name}: connection successful`); }
    catch (cause) { showToast(`Connection failed · ${cause instanceof Error ? cause.message : 'Request failed'}`); }
  }, [showToast]);

  return { performAction, testService };
}
