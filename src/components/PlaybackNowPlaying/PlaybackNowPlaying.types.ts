import type { Stream } from '@/types/dashboard.types';

export type PlaybackNowPlayingProps = {
  streams: Stream[];
  unavailable: boolean;
  /** Plex's own explanation when it is unavailable. */
  unavailableDetail?: string;
};
