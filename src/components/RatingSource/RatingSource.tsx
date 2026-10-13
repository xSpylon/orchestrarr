import type { ReactElement } from 'react';
import type { RatingSourceName, RatingSourceProps } from './RatingSource.types';

const labels: Record<RatingSourceName, string> = { tmdb: 'TMDb rating', rottentomatoes: 'Rotten Tomatoes', imdb: 'IMDb', metacritic: 'Metacritic' };

// Own drawings in each source's recognisable colours, not their logo files. The name stays for screen readers and as a tooltip.
const marks: Record<RatingSourceName, ReactElement> = {
  tmdb: <svg width="34" height="14" viewBox="0 0 34 14"><defs><linearGradient id="rating-tmdb" x1="0" x2="1"><stop offset="0" stopColor="#90cea1" /><stop offset="1" stopColor="#01b4e4" /></linearGradient></defs><rect width="34" height="14" rx="3" fill="#0d253f" /><text x="17" y="10.2" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="url(#rating-tmdb)">TMDb</text></svg>,
  rottentomatoes: <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="9.2" r="5.8" fill="#fa320a" /><path d="M8 3.6c-.8-1.4-2.2-1.8-3.3-1.3 1 .3 1.6 1 1.8 1.7-1.2-.4-2.4.1-2.9.9 1.3-.2 2.4.1 3.1.7L8 3.6Zm0 0c.8-1.4 2.2-1.8 3.3-1.3-1 .3-1.6 1-1.8 1.7 1.2-.4 2.4.1 2.9.9-1.3-.2-2.4.1-3.1.7L8 3.6Z" fill="#00912d" /></svg>,
  imdb: <svg width="30" height="14" viewBox="0 0 30 14"><rect width="30" height="14" rx="3" fill="#f5c518" /><text x="15" y="10.4" textAnchor="middle" fontSize="9" fontWeight="800" fill="#000">IMDb</text></svg>,
  metacritic: <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.5" fill="#ffcc34" /><text x="8" y="11.3" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#000">m</text></svg>,
};

export function RatingSource({ source }: RatingSourceProps) {
  return <span className="rating-source" title={labels[source]}><span aria-hidden="true">{marks[source]}</span><span className="sr-only">{labels[source]}</span></span>;
}
