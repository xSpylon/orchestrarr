import { formatTime } from '@/helpers/format';
import type { OverviewActivityEventProps } from './OverviewActivityEvent.types';
import { useLocale } from '@/lib/i18n';

export function OverviewActivityEvent({ event }: OverviewActivityEventProps) {
  const { t } = useLocale();
  return <li><span className={`activity-marker ${event.severity === 'failed' ? 'failed' : event.severity === 'attention' ? 'attention' : ''}`} aria-hidden="true" /><span><strong>{event.title}</strong><small>{event.detail || event.service || t('overview.activityUnavailable')}</small></span><time>{formatTime(event.at || event.updatedAt)}</time></li>;
}
