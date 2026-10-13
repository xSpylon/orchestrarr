import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { SummaryStrip } from '@/components/SummaryStrip/SummaryStrip';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import type { InfrastructureStorageProps } from './InfrastructureStorage.types';
import { useLocale } from '@/lib/i18n';

export function InfrastructureStorage({ unraid }: InfrastructureStorageProps) {
  const { t } = useLocale();
  const metrics = unraid?.metrics || {};
  return <section className="section-block">
    <SectionHeading title={t('infrastructure.storage')} description={t('infrastructure.storageDescription')} />
    {metrics.totalStorage
      ? <SummaryStrip items={[
        { label: t('common.total'), value: metrics.totalStorage },
        { label: t('common.used'), value: metrics.usedStorage || '—' },
        { label: t('common.free'), value: metrics.freeStorage || '—' },
        { label: t('infrastructure.disks'), value: metrics.disks?.length || 0 },
      ]} />
      : <EmptyState compact title={t('infrastructure.noCapacity')}>{t('infrastructure.noCapacityDescription')}</EmptyState>}
  </section>;
}
