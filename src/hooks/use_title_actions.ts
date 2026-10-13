import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
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
      onToast(`${mediaType === 'tv' ? 'Show' : 'Movie'} request sent to Jellyseerr`);
      await onRefresh();
    } catch (cause) {
      onToast(`Request failed · ${cause instanceof Error ? cause.message : 'Request failed'}`);
    } finally {
      setRequestSubmitting(false);
    }
  }

  async function manageJellyseerrRequest(action: 'approve' | 'decline') {
    if (!relatedRequest?.requestId || requestAction) return;
    if (action === 'decline' && !window.confirm(`Decline the request for “${title}”?`)) return;
    setRequestAction(action);
    try {
      await apiRequest(`/api/actions/jellyseerr-request?id=${encodeURIComponent(String(relatedRequest.requestId))}&action=${action}`, { method: 'POST' });
      onToast(`${title}: request ${action === 'approve' ? 'approved' : 'declined'}`);
      await onRefresh();
    } catch (cause) {
      onToast(`Could not ${action} request · ${cause instanceof Error ? cause.message : 'Request failed'}`);
    } finally {
      setRequestAction('');
    }
  }

  return { requestSubmitting, requestSubmitted, requestAction, requestFromJellyseerr, manageJellyseerrRequest };
}
