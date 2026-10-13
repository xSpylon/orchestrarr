import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { Button } from '@/components/Button/Button';
import { RequestList } from '@/components/RequestList/RequestList';
import type { OverviewNeedsApprovalProps } from './OverviewNeedsApproval.types';
import { useLocale } from '@/lib/i18n';

export function OverviewNeedsApproval({ requests, onNavigate, onSelect }: OverviewNeedsApprovalProps) {
  const { t } = useLocale();
  const pending = requests.filter((item) => ['Pending', 'Requested'].includes(String(item.state || '')));
  if (!pending.length) return null;
  return <section className="overview-section operator-requests">
    <SectionHeading variant="operator" title={t('overview.needsApproval')} count={pending.length} actions={<Button variant="link" onClick={() => onNavigate('requests')}>{t('requests.all')}</Button>} />
    <RequestList items={pending.slice(0, 4)} onSelect={onSelect} />
  </section>;
}
