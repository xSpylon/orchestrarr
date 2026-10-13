import type { DashboardData, DiscoveryItem } from '@/types/dashboard.types';
import type { DetailItem } from '@/types/title.types';
import type { MediaFocus } from '@/lib/navigation';
import { deriveTitleStatus, findFocusedEpisode, mediaTypeOf, stringValue, titleFacts } from '@/helpers/title_status';
import { useTitleMetadata } from '@/hooks/use_title_metadata';
import { useTitleRecords } from '@/hooks/use_title_records';
import { useTitleActions } from '@/hooks/use_title_actions';
import { useTitleEpisodeMetadata } from '@/hooks/use_title_episode_metadata';
import { useTitleAvailability } from '@/hooks/use_title_availability';
import { useTitleArrMatch } from '@/hooks/use_title_arr_match';
import { useTitlePlexMatch } from '@/hooks/use_title_plex_match';
import { useTitleRatings } from '@/hooks/use_title_ratings';
import { useTitleTautulli } from '@/hooks/use_title_tautulli';
import { useTitleBazarr } from '@/hooks/use_title_bazarr';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { SeasonAvailability } from '@/components/SeasonAvailability/SeasonAvailability';
import { Button } from '@/components/Button/Button';
import { TitleSynopsis } from '@/components/TitleSynopsis/TitleSynopsis';
import { TitleActions } from '@/components/TitleActions/TitleActions';
import { TitleRecentActivity } from '@/components/TitleRecentActivity/TitleRecentActivity';
import { TitlePoster } from '@/components/TitlePoster/TitlePoster';
import { TitleProperties } from '@/components/TitleProperties/TitleProperties';
import { TitleProgress } from '@/components/TitleProgress/TitleProgress';
import { TitleServices } from '@/components/TitleServices/TitleServices';
import { useLocale } from '@/lib/i18n';

type UniversalMediaDetailPageProps = {
  dashboard: DashboardData;
  item: DiscoveryItem;
  focus?: MediaFocus;
  onEpisodeSelect?: (focus?: MediaFocus) => void;
  onBack: () => void;
  onToast: (message: string) => void;
  onRefresh: () => Promise<void>;
};

export function UniversalMediaDetailPage({ dashboard, item: rawItem, focus, onEpisodeSelect, onBack, onToast, onRefresh }: UniversalMediaDetailPageProps) {
  const { t } = useLocale();
  const item = rawItem as DetailItem;
  const initialTitle = stringValue(item.title);
  const initialTmdbId = stringValue(item.id);
  const mediaType = mediaTypeOf(item);
  const refreshKey = dashboard.mode === 'demo' ? dashboard.demoProfile || 'medium' : dashboard.mode || 'live';
  const { details, metadataLoading, resolvedTmdbId, title } = useTitleMetadata(initialTitle, initialTmdbId, mediaType);
  const { relatedRequest, matchedPipeline, activity } = useTitleRecords(dashboard, resolvedTmdbId, mediaType);
  const actions = useTitleActions({ initialTitle, initialTmdbId, mediaType, resolvedTmdbId, title, relatedRequest, onToast, onRefresh });
  const episode = useTitleEpisodeMetadata(focus, resolvedTmdbId);
  const { seriesAvailability, availabilityLoading, availabilityAction, searchSonarr } = useTitleAvailability(mediaType, resolvedTmdbId, title, actions.requestSubmitted, onToast, refreshKey);
  const arrMediaMatch = useTitleArrMatch(mediaType, resolvedTmdbId, title, actions.requestSubmitted, refreshKey);
  const plexLibraryMatch = useTitlePlexMatch(mediaType, resolvedTmdbId, title, refreshKey);
  const { ratings, ratingsLoading } = useTitleRatings(mediaType, resolvedTmdbId);
  const { tautulliHistory, playback, activeStreams } = useTitleTautulli(mediaType, title, plexLibraryMatch, dashboard.streams, refreshKey);
  const selectedEpisode = findFocusedEpisode(seriesAvailability, focus);
  const bazarrMediaStatus = useTitleBazarr(mediaType, resolvedTmdbId, title, seriesAvailability.series, focus, selectedEpisode);

  const facts = titleFacts(details, stringValue(item.poster));
  const status = deriveTitleStatus({ dashboard, mediaType, relatedRequest, matchedPipeline, seriesAvailability, availabilityLoading, arrMediaMatch, plexLibraryMatch, bazarrMediaStatus, tautulliHistory, playback, activeStreams, requestSubmitted: actions.requestSubmitted });

  return <div className="universal-media-detail">
    <PageHeading eyebrow={t('detail.eyebrow')} title={title} actions={<Button onClick={onBack}>{t('common.back')}</Button>} />
    <div className="title-layout">
      <div className="title-main">
        <TitleSynopsis loading={metadataLoading} overview={facts.overview} focus={focus} episodeTitle={episode.metadata?.data?.name || selectedEpisode?.title || 'Episode details'} />
        <TitleActions
          mediaType={mediaType}
          showRequest={status.showRequestAction}
          requestDisabled={actions.requestSubmitting || !resolvedTmdbId}
          requestSubmitting={actions.requestSubmitting}
          onRequest={() => void actions.requestFromJellyseerr()}
          canManageRequest={Boolean(relatedRequest?.requestId && ['Pending', 'Requested'].includes(String(relatedRequest.state)))}
          requestAction={actions.requestAction}
          onManageRequest={(action) => void actions.manageJellyseerrRequest(action)}
          plexUrl={plexLibraryMatch.webUrl}
        />
        {mediaType === 'tv' ? <SeasonAvailability availability={seriesAvailability} loading={availabilityLoading} hasTmdbId={Boolean(resolvedTmdbId)} focus={focus} onFocusChange={onEpisodeSelect} searchAction={availabilityAction} onSearch={(seriesId, scope, seasonNumber, episodeId) => void searchSonarr(seriesId, scope, seasonNumber, episodeId)} episodeMetadata={episode.metadata} episodeLoading={episode.loading} /> : null}
        <TitleRecentActivity title={title} activity={activity} playback={playback} activeStreams={activeStreams} />
      </div>
      <aside className="title-aside" aria-label={t('detail.properties')}>
        <TitlePoster image={facts.image} title={title} loading={metadataLoading} />
        <TitleProperties mediaType={mediaType} facts={facts} tmdbId={resolvedTmdbId} metadataLoading={metadataLoading} ratings={ratings} ratingsLoading={ratingsLoading} statusResolved={status.statusResolved} isAvailable={status.isAvailable} requestState={status.requestState} pipelineState={status.pipelineState} />
        <TitleProgress relatedRequest={relatedRequest} plexLibraryMatch={plexLibraryMatch} currentStage={status.currentStage} progressStage={status.progressStage} matchedPipeline={matchedPipeline} />
        <TitleServices rows={status.serviceRows} />
      </aside>
    </div>
    <PageFooter dashboard={dashboard} />
  </div>;
}
