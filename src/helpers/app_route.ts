import { focusFromPath, type MediaFocus } from '../lib/navigation.ts';

export type AppRoute = {
  view: string;
  itemKey?: string;
  isCanonicalTitle: boolean;
  titleMediaType?: 'movie' | 'tv';
  routeFocus?: MediaFocus;
};

export function parseAppRoute(pathname: string): AppRoute {
  const parts = pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const isCanonicalTitle = parts[0] === 'title' && (parts[1] === 'movie' || parts[1] === 'tv') && Boolean(parts[2]);
  return {
    view: isCanonicalTitle ? 'media' : parts[0] || 'overview',
    itemKey: isCanonicalTitle ? parts[2] : parts[1],
    isCanonicalTitle,
    titleMediaType: isCanonicalTitle ? parts[1] as 'movie' | 'tv' : undefined,
    routeFocus: isCanonicalTitle ? focusFromPath(parts[3] || '') : undefined,
  };
}
