import { displayText } from '@/helpers/format';
import { Icon } from '@/components/ui/Icon';
import type { OverviewIssueProps } from './OverviewIssue.types';
import { translateStatus, useLocale } from '@/lib/i18n';

export function OverviewIssue({ item, onSelect }: OverviewIssueProps) {
  const { t } = useLocale();
  return <li>
    <button onClick={() => onSelect(item)}><span className={`issue-index ${/failed|error|blocked/i.test(item.state || '') ? 'critical' : ''}`}><Icon name="warning" /></span><span className="issue-copy"><strong>{displayText(item.title)}</strong><small>{translateStatus(t, item.state || 'Attention')} <i>·</i> {item.service || t('overview.sourceUnavailable')}</small></span><span className="issue-open"><Icon name="chevron" /></span></button>
  </li>;
}
