import { formatMegabytes } from '@/helpers/format';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { SummaryStrip } from '@/components/SummaryStrip/SummaryStrip';
import type { InfrastructureHostProps } from './InfrastructureHost.types';
import { useLocale } from '@/lib/i18n';

export function InfrastructureHost({ runtime = {} }: InfrastructureHostProps) {
  const { t } = useLocale();
  const load = runtime.loadAverage?.[0];
  return <section className="section-block">
    <SectionHeading title={t('infrastructure.host')} description={t('infrastructure.hostDescription')} />
    <SummaryStrip items={[
      { label: t('infrastructure.memoryUsed'), value: formatMegabytes(runtime.hostMemory?.used) },
      { label: t('infrastructure.cpuCores'), value: runtime.cpuCount || '—' },
      { label: t('infrastructure.load'), value: load != null ? Number(load).toFixed(2) : '—' },
      { label: t('infrastructure.appMemory'), value: formatMegabytes(runtime.processMemory) },
    ]} />
  </section>;
}
