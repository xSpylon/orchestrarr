import { requestStages, stringValue } from '@/helpers/title_status';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { TitlePending } from '@/components/TitlePending/TitlePending';
import type { TitleProgressProps } from './TitleProgress.types';
import { useLocale, translateStatus } from '@/lib/i18n';

export function TitleProgress({ relatedRequest, plexLibraryMatch, currentStage, progressStage, matchedPipeline }: TitleProgressProps) {
  const { t } = useLocale();
  const statusLine = !relatedRequest && plexLibraryMatch.status === 'loading' ? <TitlePending />
    : relatedRequest ? t('detail.requestedBy', undefined, { value: stringValue(relatedRequest.requester) || t('common.unknown'), age: stringValue(relatedRequest.age) || t('detail.dateUnavailable') })
      : plexLibraryMatch.status === 'found' ? t('detail.availableIn', undefined, { value: plexLibraryMatch.library || t('detail.yourPlexLibrary') })
        : t('detail.noMatchingRequest');
  return <section className="universal-media-section">
    <SectionHeading title={t('detail.progress')} />
    <div className="universal-media-status"><span>{statusLine}</span></div>
    {relatedRequest && currentStage >= 0 ? <div className="pipeline-steps universal-media-steps">{requestStages.map((name, index) => <div className={`pipeline-step ${index < progressStage ? 'complete' : ''} ${index === progressStage ? 'current' : ''}`} key={name}><span className="pipeline-node">{String(index + 1).padStart(2, '0')}</span><strong>{translateStatus(t, name)}</strong></div>)}</div> : null}
    {matchedPipeline.length ? <div className="universal-pipeline-list">{matchedPipeline.map((entry, index) => <div className="linked-pipeline-row" key={`${entry.service}-${entry.title}-${index}`}><strong>{entry.service || t('common.pipeline')}</strong><span>{entry.state ? translateStatus(t, entry.state) : t('status.unknown')}</span><small>{entry.detail || t('detail.noQueueDetails')}</small></div>)}</div> : null}
  </section>;
}
