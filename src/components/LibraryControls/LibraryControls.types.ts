import type { LibrarySort } from '@/hooks/use_library_filters';

export type LibraryControlsProps = {
  /** Lowercase plural, e.g. "movies". */
  noun: string;
  query: string;
  onQueryChange: (value: string) => void;
  sort: LibrarySort;
  onSortChange: (value: LibrarySort) => void;
};
