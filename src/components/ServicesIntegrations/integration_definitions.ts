export const integrationDefinitions = [
  { key: 'plex', name: 'Plex', description: 'Sessions, libraries, and playback context.', fields: [['token', 'Plex token']] },
  { key: 'tautulli', name: 'Tautulli', description: 'Playback activity and history.', fields: [['apiKey', 'Tautulli API key']] },
  { key: 'jellyseerr', name: 'Jellyseerr', description: 'Requests and media availability.', fields: [['apiKey', 'Jellyseerr API key']] },
  { key: 'wizarr', name: 'Wizarr', description: 'User and invitation status. Manage accounts on the Access page.', fields: [['apiKey', 'Wizarr API key'], ['publicUrl', 'Public invite URL']] },
  { key: 'cleanuparr', name: 'Cleanuparr', description: 'Recent cleanup activity and job statistics.', fields: [['apiKey', 'Cleanuparr API key']] },
  { key: 'tdarr', name: 'Tdarr', description: 'Transcoding server, nodes, and queue status. No API key is needed unless Tdarr authentication is enabled.', fields: [] },
  { key: 'prowlarr', name: 'Prowlarr', description: 'Indexer status and health checks.', fields: [['apiKey', 'Prowlarr API key']] },
  { key: 'bazarr', name: 'Bazarr', description: 'Subtitle backlog and provider health.', fields: [['apiKey', 'Bazarr API key']] },
  { key: 'sonarr', name: 'Sonarr', description: 'Series queues, calendar, and recovery actions.', fields: [['apiKey', 'Sonarr API key']] },
  { key: 'radarr', name: 'Radarr', description: 'Movie queues, calendar, and recovery actions.', fields: [['apiKey', 'Radarr API key']] },
  { key: 'qbittorrent', name: 'qBittorrent', description: 'Torrent queue, pause, and resume actions.', fields: [['username', 'qBittorrent username'], ['password', 'qBittorrent password']] },
  { key: 'sabnzbd', name: 'SABnzbd', description: 'Usenet download queue.', fields: [['apiKey', 'SABnzbd API key']] },
  { key: 'unraid', name: 'Unraid', description: 'Array storage and server health.', fields: [['apiKey', 'Unraid API key']] },
  { key: 'tmdb', name: 'TMDb', description: 'Title metadata, discovery, and TMDb ID matching.', fields: [['apiKey', 'TMDb API key']] },
  { key: 'omdb', name: 'OMDb', description: 'Metacritic score and IMDb votes on title pages. Optional; get a free key at omdbapi.com.', fields: [['apiKey', 'OMDb API key']] },
] as const;

export type IntegrationDefinition = (typeof integrationDefinitions)[number];
