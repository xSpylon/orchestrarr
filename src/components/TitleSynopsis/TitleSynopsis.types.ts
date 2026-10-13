import type { MediaFocus } from '@/lib/navigation';

export type TitleSynopsisProps = {
  loading: boolean;
  overview: string;
  focus?: MediaFocus;
  /** "Episode details" when no episode name is known; then it is left out of the focus line. */
  episodeTitle: string;
};
