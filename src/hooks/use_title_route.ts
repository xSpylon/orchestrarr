import { useCallback, useMemo } from 'react';
import { focusPath, type MediaFocus } from '@/lib/navigation';
import type { AppRoute } from '@/helpers/app_route';
import { stringValue } from '@/helpers/title_match';
import type { DiscoveryItem } from '@/types/dashboard.types';
import type { AppNavigate } from './use_app_location';

/** The title on a canonical /title route, its focused season or episode, and how to change that focus. */
export function useTitleRoute({ isCanonicalTitle, itemKey, titleMediaType, routeFocus }: AppRoute, navigate: AppNavigate) {
  // The name and poster come from history state (set by openTitle), so the page has something to show before TMDb answers.
  const titleItem = useMemo<DiscoveryItem | null>(() => isCanonicalTitle && itemKey && titleMediaType
    ? { id: itemKey, title: stringValue(window.history.state?.title), poster: stringValue(window.history.state?.poster), mediaType: titleMediaType }
    : null, [isCanonicalTitle, itemKey, titleMediaType]);
  const mediaFocus: MediaFocus | undefined = routeFocus;

  const setEpisodeFocus = useCallback((focus?: MediaFocus) => {
    if (!isCanonicalTitle || !titleMediaType || !itemKey) return;
    const basePath = `/title/${titleMediaType}/${encodeURIComponent(itemKey)}`;
    navigate(`${basePath}${focusPath(focus)}`, false, true, { ...(window.history.state || {}) });
  }, [isCanonicalTitle, itemKey, navigate, titleMediaType]);

  return { titleItem, mediaFocus, setEpisodeFocus };
}
