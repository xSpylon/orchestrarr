import type { SVGProps } from 'react';

const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  media: 'M4 3v18 M8 4h12v16H8z M12 8h4 M12 12h4',
  discovery: 'm12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8Z',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M7 3v4 M17 3v4 M3 11h18',
  requests: 'M4 4h16v16H4z M4 14h4l2 3h4l2-3h4',
  pipeline: 'M3 6h12 M11 2l4 4-4 4 M21 18H9 M13 14l-4 4 4 4 M5 14v7 M2 17h6 M19 3v7',
  streams: 'M4 4h16v13H4z M8 21h8 M12 17v4 m-2-10 5 3-5 3Z',
  activity: 'M2 12h5l3-8 4 16 3-8h5',
  services: 'M8 3v5 M16 3v5 M6 8h12v3a6 6 0 0 1-12 0Z M12 17v5',
  servers: 'M4 3h16v7H4z M4 14h16v7H4z M7 6.5h.01 M7 17.5h.01 M15 6.5h2 M15 17.5h2',
  access: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  settings: 'M4 7h16 M4 17h16 M9 4v6 M15 14v6',
  about: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 10v6 M12 7h.01',
  search: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 3 M18 18a8 8 0 0 1-13-3',
  sun: 'M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon: 'M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  sidebar: 'M3 4h18v16H3z M9 4v16',
  close: 'm6 6 12 12 M6 18 18 6',
  chevron: 'm9 5 7 7-7 7',
  arrow: 'M5 12h14 m-5-5 5 5-5 5',
  plus: 'M12 5v14 M5 12h14',
  check: 'm5 12 4 4L19 6',
  warning: 'm12 3 10 18H2Z M12 9v4 M12 17h.01',
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
