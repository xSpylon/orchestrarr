import { displayText } from '@/helpers/format';
import type { OverviewViewerProps } from './OverviewViewer.types';
import { useLocale } from '@/lib/i18n';

export function OverviewViewer({ stream }: OverviewViewerProps) {
  const { t } = useLocale();
  return <li><span className="on-air-avatar" aria-hidden="true">{(stream.user || '?').slice(0, 1).toUpperCase()}</span><span className="on-air-copy"><strong>{stream.user || t('overview.userUnavailable')}</strong><small>{displayText(stream.title)}</small></span><span className="on-air-mode">{stream.mode || t('overview.modeUnknown')}</span></li>;
}
