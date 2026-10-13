import { formatVotes } from '@/helpers/format';
import { Property } from '@/components/PropertyList/PropertyList';
import { RatingSource } from '@/components/RatingSource/RatingSource';
import { RatingLink } from '@/components/RatingLink/RatingLink';
import { TitlePending } from '@/components/TitlePending/TitlePending';
import type { TitleRatingsProps } from './TitleRatings.types';
import { useLocale } from '@/lib/i18n';

export function TitleRatings({ mediaType, tmdbId, tmdbRating, metadataLoading, ratings, ratingsLoading }: TitleRatingsProps) {
  const { rottenTomatoes, imdb, metacritic } = ratings;
  const { t } = useLocale();
  return <>
    <Property label={<RatingSource source="tmdb" />}>{tmdbRating ? <RatingLink url={tmdbId ? `https://www.themoviedb.org/${mediaType}/${encodeURIComponent(tmdbId)}` : undefined}>{tmdbRating}</RatingLink> : metadataLoading ? <TitlePending /> : t('status.unavailable')}</Property>
    {/* Rotten Tomatoes and IMDb keep their row while ratings load, so the column does not grow afterwards. */}
    {!rottenTomatoes && ratingsLoading ? <Property label={<RatingSource source="rottentomatoes" />}><TitlePending /></Property> : null}
    {rottenTomatoes ? <Property label={<RatingSource source="rottentomatoes" />}><RatingLink url={rottenTomatoes.url}>{[rottenTomatoes.critics !== undefined ? `${rottenTomatoes.critics}% critics` : '', rottenTomatoes.audience !== undefined ? `${rottenTomatoes.audience}% audience` : ''].filter(Boolean).join(' · ')}</RatingLink></Property> : null}
    {imdb ? <Property label={<RatingSource source="imdb" />}><RatingLink url={imdb.url}>{`${imdb.score.toFixed(1)} / 10${imdb.votes ? ` · ${formatVotes(imdb.votes)} votes` : ''}`}</RatingLink></Property> : null}
    {!imdb && ratingsLoading && mediaType === 'movie' ? <Property label={<RatingSource source="imdb" />}><TitlePending short /></Property> : null}
    {metacritic ? <Property label={<RatingSource source="metacritic" />}>{metacritic.score} / 100</Property> : null}
  </>;
}
