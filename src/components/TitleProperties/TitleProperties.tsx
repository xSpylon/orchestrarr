import { statusTone } from '@/helpers/format';
import { Property, PropertyList } from '@/components/PropertyList/PropertyList';
import { RatingLink } from '@/components/RatingLink/RatingLink';
import { TitlePending } from '@/components/TitlePending/TitlePending';
import { TitleRatings } from '@/components/TitleRatings/TitleRatings';
import type { TitlePropertiesProps } from './TitleProperties.types';
import { useLocale, translateStatus } from '@/lib/i18n';

export function TitleProperties({ mediaType, facts, tmdbId, metadataLoading, ratings, ratingsLoading, statusResolved, isAvailable, requestState, pipelineState }: TitlePropertiesProps) {
  const { year, release, runtime, genres, rating, cast } = facts;
  const { t } = useLocale();
  return <PropertyList className="title-properties">
    <Property label={t('detail.status')}>{statusResolved ? <span className={`status-text ${statusTone(isAvailable ? 'Available' : pipelineState || requestState)}`}>{isAvailable ? t('status.available') : requestState ? translateStatus(t, requestState) : t('detail.notRequested')}</span> : <TitlePending short />}</Property>
    <Property label={t('detail.type')}>{mediaType === 'tv' ? t('media.show') : t('media.movie')}{year ? ` · ${year}` : metadataLoading ? ' · …' : ''}</Property>
    <Property label={t('detail.release')}>{metadataLoading ? <TitlePending short /> : release || t('detail.releaseUnavailable')}</Property>
    {/* TMDb rarely has a runtime for series, so only movies keep a row for it while loading. */}
    {runtime || (metadataLoading && mediaType === 'movie') ? <Property label={t('detail.runtime')}>{runtime || <TitlePending short />}</Property> : null}
    <Property label={t('detail.genres')}>{genres || (metadataLoading ? <TitlePending /> : t('status.unavailable'))}</Property>
    <Property label="TMDb ID">{facts.tmdbId || tmdbId || t('status.unavailable')}</Property>
    <TitleRatings mediaType={mediaType} tmdbId={tmdbId} tmdbRating={rating} metadataLoading={metadataLoading} ratings={ratings} ratingsLoading={ratingsLoading} />
    {!cast.length && metadataLoading ? <Property label={t('detail.cast')}><TitlePending lines={3} /></Property> : null}
    {cast.length ? <Property label={t('detail.cast')}>{cast.map((person, index) => <span key={person.id ?? person.name}>{index ? ', ' : ''}<RatingLink url={person.id ? `https://www.themoviedb.org/person/${person.id}` : undefined}>{person.name || ''}</RatingLink></span>)}</Property> : null}
  </PropertyList>;
}
