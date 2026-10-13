import type { AvailabilityEpisode } from '@/types/dashboard.types';

export const QUEUE_PROBLEM = /error|warning|stalled|failed|blocked/i;

export function episodeStatus(episode: AvailabilityEpisode): string {
  if (episode.source === 'tmdb') return 'Not tracked';
  if (episode.queue?.status) return episode.queue.status;
  if (episode.hasFile) return 'Available';
  if (!episode.monitored) return 'Unmonitored';
  const airDate = episode.airDateUtc ? new Date(episode.airDateUtc).getTime() : Number.NaN;
  return (Number.isFinite(airDate) && airDate > Date.now()) || (!episode.airDateUtc && /^tba$/i.test(episode.title)) ? 'Upcoming' : 'Missing';
}

export function canSearchEpisode(episode: AvailabilityEpisode): boolean {
  return episodeStatus(episode) === 'Missing' || (Boolean(episode.queue) && QUEUE_PROBLEM.test(episode.queue?.status || ''));
}
