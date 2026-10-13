import type { DashboardData, DashboardItem } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { RequestList } from '@/components/RequestList/RequestList';
import { apiRequest } from '@/lib/api';
import { ViewTabs } from '@/components/ViewTabs/ViewTabs';
import { Button } from '@/components/Button/Button';
import { ResultsCount } from '@/components/ResultsCount/ResultsCount';
import { Pagination } from '@/components/Pagination/Pagination';
import { RequestsFilters } from '@/components/RequestsFilters/RequestsFilters';
import { useRequestsFilters } from '@/hooks/use_requests_filters';
import { useLocale } from '@/lib/i18n';

type RequestsPageProps = { dashboard: DashboardData; onSelect: (item: DashboardItem) => void; onNewRequest: () => void; onToast: (message: string) => void; onRefresh: () => Promise<void> };

export function RequestsPage({ dashboard, onSelect, onNewRequest, onToast, onRefresh }: RequestsPageProps) {
  const { t } = useLocale();
  const items = dashboard.requests || [];
  const filters = useRequestsFilters(items);
  const { filtered, visible, start } = filters;

  async function manageRequest(item: DashboardItem, action: 'approve' | 'decline') {
    if (!item.requestId) {
      onToast(t('requests.noId'));
      return;
    }
    if (action === 'decline' && !window.confirm(t('requests.confirmDecline', undefined, { title: item.title }))) return;
    try {
      await apiRequest(`/api/actions/jellyseerr-request?id=${encodeURIComponent(String(item.requestId))}&action=${action}`, { method: 'POST' });
      onToast(t('requests.actionComplete', undefined, { title: item.title, action: action === 'approve' ? t('requests.approved') : t('requests.declined') }));
      await onRefresh();
    } catch (cause) {
      onToast(t('requests.actionFailed', undefined, { action, reason: cause instanceof Error ? cause.message : t('common.requestFailed') }));
    }
  }

  return <>
    <PageHeading eyebrow={t('requests.eyebrow')} title={t('nav.requests')} actions={<Button variant="solid" onClick={onNewRequest}>{t('overview.newRequest')}</Button>} />
    <ViewTabs id="requests" label={t('requests.view')} tabs={[{ value: 'approval', label: t('requests.needsApproval') }, { value: 'all', label: t('requests.all') }]} value={filters.filter} onChange={filters.setFilter}>
    <RequestsFilters filters={filters} />
    <ResultsCount>{t('requests.showing', undefined, { start: filtered.length ? start + 1 : 0, end: Math.min(start + visible.length, filtered.length), total: filtered.length })}</ResultsCount>
    <RequestList items={visible} emptyMessage={items.length ? t('requests.filteredEmpty') : t('requests.unavailable')} onSelect={onSelect} onRequestAction={(item, action) => void manageRequest(item, action)} />
    <Pagination page={filters.activePage} pageCount={filters.pageCount} onChange={filters.setPage} label={t('requests.pagination')} />
    </ViewTabs>
    <PageFooter dashboard={dashboard} />
  </>;
}
