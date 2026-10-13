import type { ResultsCountProps } from './ResultsCount.types';

/** "Showing 1–40 of 607 titles": announced to screen readers when a filter changes it. */
export function ResultsCount({ children }: ResultsCountProps) {
  return <p className="results-count" aria-live="polite">{children}</p>;
}
