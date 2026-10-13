import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { Button } from '@/components/Button/Button';
import { OverviewIssue } from '@/components/OverviewIssue/OverviewIssue';
import type { OverviewNeedsAttentionProps } from './OverviewNeedsAttention.types';
import { useLocale } from '@/lib/i18n';

export function OverviewNeedsAttention({ items, onNavigate, onSelect }: OverviewNeedsAttentionProps) {
  const { t } = useLocale();
  return <section className="overview-section operator-attention">
    <SectionHeading variant="operator" title={t('overview.needsAttention')} count={items.length} actions={<Button variant="link" onClick={() => onNavigate('activity?filter=alerts')}>{t('overview.alertLog')}</Button>} />
    {items.length
      ? <ul className="operator-issue-list">{items.slice(0, 4).map((item, index) => <OverviewIssue key={`${item.title}-${item.service}-${index}`} item={item} onSelect={onSelect} />)}</ul>
      : <div className="operator-clear-state"><span aria-hidden="true">✓</span><div><strong>{t('overview.noIntervention')}</strong><p>{t('overview.noInterventionDescription')}</p></div></div>}
    {items.length > 4 ? <button className="operator-more" onClick={() => onNavigate('activity?filter=alerts')}>{t('overview.viewIssues', undefined, { value: items.length })}</button> : null}
  </section>;
}
