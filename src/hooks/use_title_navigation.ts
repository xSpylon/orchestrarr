import { useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { focusPath, type MediaFocus } from '@/lib/navigation';
import { takeClickedPoster, transitionToTitle } from '@/lib/poster_transition';
import { mediaTypeOf, stringValue, uniqueTmdbMatch } from '@/helpers/title_match';
import type { DashboardItem } from '@/types/dashboard.types';
import type { AppNavigate } from './use_app_location';

export type TitleSource = 'discovery' | 'request' | 'media' | 'calendar';
export type OpenTitle = (rawItem: object, source: TitleSource, options?: { focus?: MediaFocus }) => Promise<void>;

/** Resolves any item to its TMDb title and opens /title/:type/:id, morphing the clicked poster into the page. */
export function useTitleNavigation(navigate: AppNavigate, showToast: (message: string) => void): OpenTitle {
  const { t } = useLocale();
  return useCallback<OpenTitle>(async (rawItem, source, options = {}) => {
    // Taken before any await, while the clicked card is still on screen.
    const clickedPoster = takeClickedPoster();
    let item = rawItem as Record<string, unknown>;
    let mediaType = mediaTypeOf(item);
    let tmdbId = stringValue(source === 'discovery' ? item.id : item.tmdbId);
    let focus = options.focus;

    if (source === 'media' && item.ratingKey) {
      try {
        const context = await apiRequest<{ item?: DashboardItem; focus?: MediaFocus } | null>(`/api/plex/media-context?ratingKey=${encodeURIComponent(String(item.ratingKey))}`);
        if (context?.item) {
          item = context.item as Record<string, unknown>;
          mediaType = mediaTypeOf(item);
          tmdbId = stringValue(item.tmdbId);
          focus ||= context.focus;
        }
      } catch { /* A title search can still resolve a Plex item without a TMDb GUID. */ }
    }

    if (!tmdbId) {
      const title = stringValue(item.title || item.name);
      try {
        const payload = await apiRequest<{ results?: Array<Record<string, unknown>> }>(`/api/discovery?q=${encodeURIComponent(title)}`);
        tmdbId = uniqueTmdbMatch(payload.results || [], title, mediaType, item.year);
      } catch { /* Keep the source item unresolved when TMDb cannot verify it. */ }
    }

    if (!tmdbId) {
      showToast(t('actions.noTmdbMatch', undefined, { title: stringValue(item.title) || t('actions.thisTitle') }));
      return;
    }

    if (!focus && source === 'calendar' && stringValue(item.type).toLowerCase() === 'episode') {
      const episode = /S(\d+)\s*E(\d+)/i.exec(stringValue(item.detail));
      if (episode) focus = { kind: 'episode', seasonNumber: Number(episode[1]), episodeNumber: Number(episode[2]) };
    }

    const destination = `/title/${mediaType}/${encodeURIComponent(tmdbId)}${focusPath(focus)}`;
    // The detail page shows this name straight away instead of waiting for TMDb; always set it so a previous title never lingers.
    const state = { ...(window.history.state || {}), title: stringValue(item.title || item.name), poster: clickedPoster?.src || '' };
    // A new title opens at the top, where its poster is.
    state.returnTo = `${window.location.pathname}${window.location.search}`;
    transitionToTitle(clickedPoster, () => navigate(destination, false, false, state));
  }, [navigate, showToast, t]);
}
