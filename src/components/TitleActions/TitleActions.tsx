import { Button } from '@/components/Button/Button';
import { buttonClass } from '@/components/Button/button_class';
import type { TitleActionsProps } from './TitleActions.types';
import { useLocale } from '@/lib/i18n';

export function TitleActions({ mediaType, showRequest, requestDisabled, requestSubmitting, onRequest, canManageRequest, requestAction, onManageRequest, plexUrl }: TitleActionsProps) {
  const { t } = useLocale();
  return <>
    {showRequest ? <div className="universal-media-actions"><Button variant="solid" disabled={requestDisabled} onClick={onRequest}>{requestSubmitting ? t('detail.sendingRequest') : t(mediaType === 'tv' ? 'detail.requestShow' : 'detail.requestMovie')}</Button></div> : null}
    {canManageRequest ? <section className="universal-request-actions" aria-label={t('detail.requestActions')}>
      <Button variant="solid" disabled={Boolean(requestAction)} onClick={() => onManageRequest('approve')}>{requestAction === 'approve' ? t('detail.approving') : t('requests.approveRequest')}</Button>
      <Button disabled={Boolean(requestAction)} onClick={() => onManageRequest('decline')}>{requestAction === 'decline' ? t('detail.declining') : t('requests.declineRequest')}</Button>
    </section> : null}
    {plexUrl ? <div className="universal-media-actions"><a className={buttonClass({ variant: 'solid' })} href={plexUrl} target="_blank" rel="noopener noreferrer">{t('common.openIn', undefined, { value: 'Plex' })}</a></div> : null}
  </>;
}
