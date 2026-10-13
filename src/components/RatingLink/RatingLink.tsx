import type { RatingLinkProps } from './RatingLink.types';

// The value itself links to its source (a score's site, an actor's TMDb page), so there is no separate "Open" next to it.
export function RatingLink({ url, children }: RatingLinkProps) {
  return url ? <a className="rating-link" href={url} target="_blank" rel="noreferrer">{children}</a> : <>{children}</>;
}
