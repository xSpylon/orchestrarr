import type { MediaType } from '@/types/title.types';

export type TitleActionsProps = {
  mediaType: MediaType;
  showRequest: boolean;
  requestDisabled: boolean;
  requestSubmitting: boolean;
  onRequest: () => void;
  /** An open Jellyseerr request that can still be approved or declined. */
  canManageRequest: boolean;
  requestAction: string;
  onManageRequest: (action: 'approve' | 'decline') => void;
  plexUrl?: string;
};
