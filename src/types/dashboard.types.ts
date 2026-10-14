export type Service = {
  name: string;
  service?: string;
  state: string;
  detail?: string;
  checkedAt?: string;
  metrics?: {
    totalStorage?: string;
    usedStorage?: string;
    freeStorage?: string;
    wantedEpisodes?: number;
    wantedMovies?: number;
    providerIssues?: number;
    healthIssues?: number;
    indexersTotal?: number;
    indexersEnabled?: number;
    usersTotal?: number;
    invitationsTotal?: number;
    invitationsAvailable?: number;
    tdarrNodes?: number;
    transcodeQueued?: number;
    transcodeErrors?: number;
    healthCheckQueued?: number;
    healthCheckErrors?: number;
    eventsTotal?: number;
    strikesTotal?: number;
    itemsRemoved?: number;
    jobRuns?: number;
    jobErrors?: number;
    timeframeHours?: number;
    disks?: unknown[];
  };
  containers?: DockerContainer[];
};

export type DockerContainer = {
  name: string;
  image?: string;
  status?: string;
};

export type DashboardItem = {
  title: string;
  detail?: string;
  state?: string;
  service?: string;
  server?: string;
  updated?: string;
  addedAt?: string | number;
  requester?: string;
  age?: string;
  type?: string;
  year?: string | number;
  library?: string;
  thumb?: string;
  ratingKey?: string;
  tmdbId?: string | number;
  mediaType?: string;
  externalId?: string | number;
  requestId?: string | number;
  sourceId?: string;
  progress?: number;
  needsAction?: boolean;
  queueId?: string | number;
  actionId?: string | number;
  torrentHash?: string;
  retryAction?: string;
  openUrl?: string;
  blocklistAction?: boolean;
  /** A complete Radarr/Sonarr download waiting on import: Import now finishes it and removes the download. */
  importAction?: boolean;
  pipelineItems?: DashboardItem[];
  [key: string]: unknown;
};

export type ActivityItem = {
  id?: string;
  title: string;
  detail?: string;
  service?: string;
  severity?: string;
  type?: string;
  at?: string;
  updatedAt?: string;
  resolved?: boolean;
};

export type Stream = DashboardItem & {
  user?: string;
  quality?: string;
  device?: string;
  mode?: string;
  client?: string;
  videoCodec?: string;
  audioCodec?: string;
  bandwidth?: number;
  duration?: number;
  progress?: number;
};

export type DashboardData = {
  mode?: 'demo' | 'live' | string;
  /** A shared public demo: settings are locked and changes are not saved. */
  publicDemo?: boolean;
  /** Demo mode only: which checklist tasks this visitor has done. */
  demoTour?: DemoTour;
  demoProfile?: 'small' | 'medium' | 'large' | string;
  generatedAt?: string;
  health?: {
    label?: string;
    online?: number;
    total?: number;
    freeStorage?: string;
  };
  runtime?: {
    uptime?: string;
    host?: string;
    processMemory?: number;
    processUptime?: number;
    cpuCount?: number;
    hostMemory?: { used?: number };
    loadAverage?: number[];
  };
  streams?: Stream[];
  pipeline?: DashboardItem[];
  requests?: DashboardItem[];
  media?: DashboardItem[];
  allMedia?: DashboardItem[];
  requestedMedia?: DashboardItem[];
  missingMedia?: DashboardItem[];
  services?: Service[];
  activity?: ActivityItem[];
  alerts?: ActivityItem[];
  analytics?: {
    history?: Array<{ title?: string; seriesTitle?: string; user?: string; platform?: string; watchedAt?: number }>;
    summary?: { plays?: number; users?: number; totalMinutes?: number; periodDays?: number };
  };
  links?: Record<string, string>;
};

export type ServiceConfig = {
  url?: string;
  /** Wizarr only: the address invitees use, joined onto invite paths. */
  publicUrl?: string;
  configured?: boolean;
};

export type DemoTour = { requested: boolean; approved: boolean; declined: boolean; imported: boolean; paused: boolean; blocklisted: boolean; invited: boolean; removed: boolean };

export type AppConfig = {
  demoMode?: boolean;
  publicDemo?: boolean;
  demoProfile?: 'small' | 'medium' | 'large' | string;
  authMode?: string;
  /** Secrets are never returned; only whether they are set, and which fields an environment variable controls. */
  auth?: { mode?: string; apiKeySet?: boolean; username?: string; passwordSet?: boolean; managedByEnv?: string[] };
  notificationsConfigured?: boolean;
  services?: Record<string, ServiceConfig>;
};

export type DiscoveryItem = {
  id: number | string;
  title: string;
  poster?: string;
  posterPath?: string;
  detail?: string;
  overview?: string;
  mediaType?: string;
};

export type CalendarEntry = {
  title: string;
  date?: string;
  detail?: string;
  service?: string;
  type?: string;
  mediaType?: 'tv' | 'movie';
  tmdbId?: string | number;
  sourceId?: string;
};

export type EpisodeMetadata = { name?: string; overview?: string; air_date?: string; runtime?: number; still_path?: string; vote_average?: number; guest_stars?: Array<{ name?: string; character?: string }> };
export type AvailabilityEpisode = { id: number; episodeNumber: number; title: string; airDateUtc: string; overview?: string; runtime?: number; hasFile: boolean; monitored: boolean; source?: 'sonarr' | 'tmdb'; queue?: { status: string; detail: string; progress: number } | null };
export type AvailabilitySeason = { seasonNumber: number; episodeFileCount: number; totalEpisodeCount: number; episodes: AvailabilityEpisode[] };
export type SeriesAvailability = { series?: { seriesId?: number; source?: 'sonarr' | 'tmdb'; seriesTitle?: string; seasons: AvailabilitySeason[] }; sonarrUnavailable?: boolean; sonarrMatchUnresolved?: boolean; configured?: boolean; tmdbGuideUnavailable?: boolean };
