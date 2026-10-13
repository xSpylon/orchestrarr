import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { Button } from '@/components/Button/Button';
import { DataTable } from '@/components/DataTable/DataTable';
import type { OverviewQueueProps } from './OverviewQueue.types';
import { useLocale } from '@/lib/i18n';

export function OverviewQueue({ items, onNavigate, onSelect }: OverviewQueueProps) {
  const { t } = useLocale();
  return <section className="overview-section operator-queue">
    <SectionHeading variant="operator" title={t('overview.acquisitionQueue')} count={items.length} actions={<Button variant="link" onClick={() => onNavigate('pipeline')}>{t('overview.viewQueue')}</Button>} />
    <DataTable items={items.slice(0, 6)} empty={t('overview.queueUnavailable')} onSelect={onSelect} />
  </section>;
}
