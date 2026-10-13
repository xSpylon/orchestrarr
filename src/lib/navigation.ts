export const navigationGroups = [
  {
    group: 'Media',
    items: [
      ['media', 'Library', 'Browse connected media'],
      ['discovery', 'Discover', 'Find something new'],
      ['calendar', 'Calendar', 'Upcoming releases'],
    ],
  },
  {
    group: 'Acquisition',
    items: [
      ['requests', 'Requests', 'Track requested media'],
      ['pipeline', 'Pipeline', 'Downloads and imports'],
    ],
  },
  {
    group: 'Observe',
    items: [
      ['streams', 'Playback', 'Monitor active Plex sessions'],
      ['activity', 'Activity', 'Review changes and alerts'],
    ],
  },
  {
    group: 'System',
    items: [
      ['services', 'Services', 'Inspect connected integrations'],
      ['servers', 'Infrastructure', 'Check storage and host capacity'],
      ['access', 'Access', 'Manage users and invitations'],
      ['settings', 'Settings', 'Configure Orchestrarr'],
      ['about', 'About', 'Project information and notices'],
    ],
  },
] as const;

export const navigationLabels: Record<string, string> = {
  overview: 'Overview',
  ...Object.fromEntries(navigationGroups.flatMap(({ items }) => items.map(([key, label]) => [key, label]))),
};

export const navigationPaths: Record<string, string> = {
  overview: '/',
  ...Object.fromEntries(navigationGroups.flatMap(({ items }) => items.map(([key]) => [key, `/${key === 'streams' ? 'streams' : key}`]))),
};

/** Keyboard "G then key" navigation. */
export const navigationShortcuts: Record<string, string> = {
  overview: 'o',
  media: 'l',
  discovery: 'd',
  calendar: 'c',
  requests: 'r',
  pipeline: 'p',
  streams: 'w',
  activity: 'a',
  services: 's',
  servers: 'i',
  access: 'u',
  settings: ',',
  about: 'b',
};

export function shortcutDestination(previousKey: string, key: string): string | undefined {
  if (previousKey.toLowerCase() !== 'g') return undefined;
  const view = Object.keys(navigationShortcuts).find((entry) => navigationShortcuts[entry] === key.toLowerCase());
  return view ? navigationPaths[view] : undefined;
}

export type MediaFocus = { kind: 'episode' | 'season'; seasonNumber?: number; episodeNumber?: number };

// Title focus lives in the path: /title/tv/:id/s1 for a season, /s1e2 for an episode.
export function focusFromPath(segment: string): MediaFocus | undefined {
  const match = /^s(\d+)(?:e(\d+))?$/i.exec(segment);
  if (!match) return undefined;
  return match[2] === undefined
    ? { kind: 'season', seasonNumber: Number(match[1]) }
    : { kind: 'episode', seasonNumber: Number(match[1]), episodeNumber: Number(match[2]) };
}

export function focusPath(focus: MediaFocus | undefined): string {
  if (focus?.seasonNumber === undefined) return '';
  if (focus.kind === 'season') return `/s${focus.seasonNumber}`;
  return focus.episodeNumber === undefined ? '' : `/s${focus.seasonNumber}e${focus.episodeNumber}`;
}
