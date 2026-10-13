import type { Service, Stream } from '@/types/dashboard.types';

export type OverviewNowWatchingProps = {
  streams: Stream[];
  plex?: Service;
  onNavigate: (view: string) => void;
};
