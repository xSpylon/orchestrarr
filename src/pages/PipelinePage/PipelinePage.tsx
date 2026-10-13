import type { DashboardData, DashboardItem } from '@/types/dashboard.types';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { DataTable } from '@/components/DataTable/DataTable';
import { PipelineFilters } from '@/components/PipelineFilters/PipelineFilters';
import { usePipelineFilters } from '@/hooks/use_pipeline_filters';
import { useLocale } from '@/lib/i18n';

type PipelinePageProps = { dashboard: DashboardData; onSelect: (item: DashboardItem) => void; onAction: (action: string, item: DashboardItem) => void };

export function PipelinePage({ dashboard, onSelect, onAction }: PipelinePageProps) {
  const { t } = useLocale();
  const items = dashboard.pipeline || [];
  const filters = usePipelineFilters(items);
  return <>
    <PageHeading eyebrow={t('pipeline.eyebrow')} title={t('nav.pipeline')} />
    <PipelineFilters filters={filters} />
    <DataTable grouped items={filters.filtered} empty={items.length ? t('pipeline.filteredEmpty') : t('pipeline.unavailable')} onSelect={onSelect} onAction={onAction} />
    <PageFooter dashboard={dashboard} />
  </>;
}
