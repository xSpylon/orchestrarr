import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { useConfirmation } from '@/components/ConfirmationProvider/ConfirmationProvider';
import type { DashboardItem } from '@/types/dashboard.types';
import type { MediaType } from '@/types/title.types';

type TitleActionsInput = {
  initialTitle: string;
  initialTmdbId: string;
  mediaType: MediaType;
  resolvedTmdbId: string;
  title: string;
  relatedRequest?: DashboardItem;
  onToast: (message: string) => void;
  onRefresh: () => Promise<void>;
};

/** Requesting the title in Jellyseerr, and approving or declining an open request. */
export function useTitleActions({ initialTitle, initialTmdbId, mediaType, resolvedTmdbId, title, relatedRequest, onToast, onRefresh }: TitleActionsInput) {
  const { t } = useLocale();
  const confirm = useConfirmation();
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestAction, setRequestAction] = useState('');

  useEffect(() => {
    setRequestSubmitted(false);
  }, [initialTitle, initialTmdbId]);

  async function requestFromJellyseerr() {
    if (!resolvedTmdbId || requestSubmitting || requestSubmitted) return;
    setRequestSubmitting(true);
    try {
      await apiRequest('/api/actions/request-jellyseerr', {
        method: 'POST',
        body: JSON.stringify({ mediaType, tmdbId: resolvedTmdbId })
      });
      setRequestSubmitted(true);
      onToast(t(mediaType === 'tv' ? 'actions.requestSentShow' : 'actions.requestSentMovie'));
      await onRefresh();
    } catch (cause) {
      onToast(t('actions.requestFailed', undefined, { reason: cause instanceof Error ? cause.message : t('common.requestFailed') }));
    } finally {
      setRequestSubmitting(false);
    }
  }

  async function manageJellyseerrRequest(action: 'approve' | 'decline') {
    if (!relatedRequest?.requestId || requestAction) return;
    if (action === 'decline' && !await confirm({ title: t('actions.confirmDecline', undefined, { title }), destructive: true })) return;
    setRequestAction(action);
    try {
      await apiRequest(`/api/actions/jellyseerr-request?id=${encodeURIComponent(String(relatedRequest.requestId))}&action=${action}`, { method: 'POST' });
      onToast(t(action === 'approve' ? 'actions.requestApproved' : 'actions.requestDeclined', undefined, { title }));
      await onRefresh();
    } catch (cause) {
      onToast(t(action === 'approve' ? 'actions.approveFailed' : 'actions.declineFailed', undefined, { reason: cause instanceof Error ? cause.message : t('common.requestFailed') }));
    } finally {
      setRequestAction('');
    }
  }

  return { requestSubmitting, requestSubmitted, requestAction, requestFromJellyseerr, manageJellyseerrRequest };
}
