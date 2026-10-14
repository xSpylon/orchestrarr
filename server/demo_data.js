const poster = (name) => '/demo/posters/' + name + '.png';
const dayMs = 86400000;

const posterSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const demoProfileNames = ['small', 'medium', 'large'];
export const defaultDemoProfile = 'medium';
const demoProfileAliases = { compact: 'small', standard: 'medium', busy: 'large' };
export const demoProfileInputNames = [...demoProfileNames, ...Object.keys(demoProfileAliases)];
const demoProfiles = {
  small: { catalogLimit: 24, recentLimit: 8, requestCount: 48, approvalCount: 3, historyCount: 144, pipelineCount: 18, streamCount: 4, userCount: 12, calendarMinimum: 1, calendarSpread: 2, calendarStart: -14, calendarEnd: 90 },
  medium: { catalogLimit: 96, recentLimit: 24, requestCount: 240, approvalCount: 6, historyCount: 720, pipelineCount: 72, streamCount: 10, userCount: 60, calendarMinimum: 2, calendarSpread: 4, calendarStart: -60, calendarEnd: 240 },
  large: { catalogLimit: 96, recentLimit: 36, requestCount: 480, approvalCount: 12, historyCount: 1440, pipelineCount: 120, streamCount: 18, userCount: 60, calendarMinimum: 5, calendarSpread: 5, calendarStart: -90, calendarEnd: 365 }
};

export function normalizeDemoProfile(value) { const name = String(value); return demoProfileNames.includes(name) ? name : demoProfileAliases[name] || defaultDemoProfile; }
function profileFor(value) { return demoProfiles[normalizeDemoProfile(value)]; }

const catalogSeeds = [
  { id: 900001, title: 'The Quiet Signal', mediaType: 'movie', year: 2023, poster: poster('quiet_signal'), overview: 'A night-shift astronomer hears a transmission that should not exist and follows it across a frozen coast.', runtime: 118, genres: ['Science Fiction', 'Mystery'], voteAverage: 8.1, voteCount: 1842, rating: { rottenTomatoes: 92, imdb: 8.1, metacritic: 79 } },
  { id: 900002, title: 'Glass Garden', mediaType: 'tv', year: 2022, poster: poster('glass_garden'), overview: 'A small research collective grows a hidden ecosystem while the city above it runs out of water.', runtime: 52, genres: ['Drama', 'Science Fiction'], voteAverage: 8.4, voteCount: 3210, rating: { rottenTomatoes: 94, imdb: 8.4, metacritic: 86 } },
  { id: 900003, title: 'Long Way Home', mediaType: 'movie', year: 2025, poster: poster('long_way_home'), overview: 'Three siblings cross a changing desert to return an old radio to the town that built it.', runtime: 126, genres: ['Adventure', 'Drama'], voteAverage: 7.8, voteCount: 947, rating: { rottenTomatoes: 88, imdb: 7.8, metacritic: 75 } },
  { id: 900004, title: 'The Deep Archive', mediaType: 'tv', year: 2021, poster: poster('deep_archive'), overview: 'Divers discover a library beneath the sea whose catalog predicts events on the surface.', runtime: 48, genres: ['Mystery', 'Thriller'], voteAverage: 8.2, voteCount: 2264, rating: { rottenTomatoes: 91, imdb: 8.2, metacritic: 81 } },
  { id: 900005, title: 'Northern Signal', mediaType: 'tv', year: 2024, poster: poster('northern_signal'), overview: 'At a remote radio station, a new crew keeps hearing tomorrow’s weather report.', runtime: 54, genres: ['Drama', 'Mystery'], voteAverage: 8.0, voteCount: 1180, rating: { rottenTomatoes: 90, imdb: 8.0, metacritic: 78 } },
  { id: 900006, title: 'Rainline', mediaType: 'movie', year: 2023, poster: poster('rainline'), overview: 'A courier in a city of perpetual rain maps a route that appears only once every decade.', runtime: 104, genres: ['Crime', 'Science Fiction'], voteAverage: 7.6, voteCount: 731, rating: { rottenTomatoes: 84, imdb: 7.6, metacritic: 72 } },
  { id: 900007, title: 'Aster House', mediaType: 'tv', year: 2020, poster: poster('aster_house'), overview: 'Residents of an old observatory learn why every room has a different view of the same night.', runtime: 46, genres: ['Drama', 'Mystery'], voteAverage: 7.9, voteCount: 1544, rating: { rottenTomatoes: 87, imdb: 7.9, metacritic: 76 } },
  { id: 900008, title: 'Morrow Field', mediaType: 'movie', year: 2022, poster: poster('morrow_field'), overview: 'A field engineer returns to a valley where the machines remember everyone who left.', runtime: 111, genres: ['Drama', 'Adventure'], voteAverage: 7.5, voteCount: 602, rating: { rottenTomatoes: 82, imdb: 7.5, metacritic: 69 } },
  { id: 900009, title: 'Tide Library', mediaType: 'tv', year: 2019, poster: poster('tide_library'), overview: 'A librarian follows a chain of books that moves between coastal towns with every tide.', runtime: 45, genres: ['Drama', 'Fantasy'], voteAverage: 8.3, voteCount: 2877, rating: { rottenTomatoes: 93, imdb: 8.3, metacritic: 84 } },
  { id: 900010, title: 'Daybreak Motel', mediaType: 'movie', year: 2024, poster: poster('daybreak_motel'), overview: 'Guests at a roadside motel wake up one hour earlier each day and begin to compare notes.', runtime: 99, genres: ['Mystery', 'Drama'], voteAverage: 7.7, voteCount: 512, rating: { rottenTomatoes: 86, imdb: 7.7, metacritic: 74 } },
  { id: 900011, title: 'Afterlight', mediaType: 'tv', year: 2023, poster: poster('afterlight'), overview: 'A restoration crew brings an abandoned mountain observatory back online, one lamp at a time.', runtime: 50, genres: ['Drama', 'Science Fiction'], voteAverage: 8.1, voteCount: 1904, rating: { rottenTomatoes: 91, imdb: 8.1, metacritic: 80 } },
  { id: 900012, title: 'The Last Cartographer', mediaType: 'movie', year: 2021, poster: poster('the_last_cartographer'), overview: 'A mapmaker redraws a city after its streets begin changing places at night.', runtime: 114, genres: ['Adventure', 'Mystery'], voteAverage: 7.9, voteCount: 1108, rating: { rottenTomatoes: 89, imdb: 7.9, metacritic: 77 } }
];

const titlePrefixes = ['Amber', 'Atlas', 'Blue', 'Copper', 'Cinder', 'Cloud', 'Crimson', 'Distant', 'Electric', 'Fallow', 'Golden', 'Harbor', 'Hidden', 'Iron', 'Juniper', 'Kinetic', 'Lumen', 'Midnight', 'Morrow', 'Nova', 'Opal', 'Paper', 'Quartz', 'Redwood', 'Silver', 'Tide', 'Umbra', 'Violet', 'Winter', 'Yellow'];
const titleNouns = ['Atlas', 'Circuit', 'Cove', 'Field', 'Garden', 'Harbor', 'House', 'Ledger', 'Line', 'Mile', 'Orchard', 'Passage', 'Radio', 'River', 'Room', 'Station', 'Valley', 'Window'];
const overviewOpeners = ['A patient crew', 'An unlikely pair', 'A young archivist', 'A retired engineer', 'Three friends', 'A night operator', 'A missing cartographer', 'A family of makers', 'A quiet investigator', 'A group of volunteers'];
const overviewActions = ['follows a trail that appears only at low tide', 'finds a message hidden inside an ordinary machine', 'returns to a place that no longer exists on any map', 'tries to keep a fragile community together through one difficult season', 'discovers that a familiar routine has been quietly changing for years', 'crosses an unfamiliar landscape to repair an old promise', 'opens a door that should have remained sealed', 'records a signal from somewhere beyond the weather', 'reconstructs a story from fragments left by strangers', 'learns that every answer creates a more personal question'];
const genres = [['Drama', 'Mystery'], ['Science Fiction', 'Drama'], ['Adventure', 'Mystery'], ['Thriller', 'Drama'], ['Fantasy', 'Drama'], ['Crime', 'Mystery'], ['Science Fiction', 'Thriller']];
const castNames = ['Ada Mercer', 'Jon Bell', 'Rhea Sol', 'Milo Hart', 'Mara Quill', 'Tomas Reed', 'Nell Aran', 'Ivo Chen', 'Sana Vale', 'Oren Pike', 'Lio Marsh', 'Vera North'];

function generatedCatalogItem(index) {
  const prefix = titlePrefixes[index % titlePrefixes.length];
  const noun = titleNouns[Math.floor(index / titlePrefixes.length) % titleNouns.length];
  const mediaType = index % 3 === 1 || index % 7 === 0 ? 'tv' : 'movie';
  const year = 2016 + (index * 7) % 11;
  const rating = Number((7.1 + ((index * 13) % 15) / 10).toFixed(1));
  const title = prefix + ' ' + noun;
  return {
    id: 900013 + index, title, mediaType, year, poster: poster(posterSlug(title)),
    overview: overviewOpeners[index % overviewOpeners.length] + ' ' + overviewActions[(index * 3) % overviewActions.length] + '.',
    runtime: mediaType === 'tv' ? 42 + (index * 5) % 19 : 91 + (index * 11) % 45,
    genres: genres[index % genres.length], voteAverage: rating, voteCount: 180 + ((index * 317) % 6200),
    rating: { rottenTomatoes: 72 + ((index * 7) % 27), imdb: rating, metacritic: 61 + ((index * 11) % 34) },
    seasons: mediaType === 'tv' ? 2 + (index % 4) : 0, episodesPerSeason: mediaType === 'tv' ? 6 + (index % 5) : 0
  };
}

const catalog = [...catalogSeeds, ...Array.from({ length: 86 }, (_, index) => generatedCatalogItem(index))].map((item, index) => ({
  ...item, seasons: item.mediaType === 'tv' ? item.seasons || 2 + (index % 4) : 0, episodesPerSeason: item.mediaType === 'tv' ? item.episodesPerSeason || 6 + (index % 5) : 0
}));

const demoRequestOnlyItems = [catalog[6], ...catalog.slice(91, 96)];
const demoRequestOnlyIds = new Set(demoRequestOnlyItems.map((item) => item.id));
// Titles nobody owns or has requested yet, so Discover always has something to request. The queue skips them,
// and the two extra catalog titles after the Discover range keep the library the same size.
const demoUnrequestedIds = new Set([catalog[4].id, catalog[9].id]);

function demoLibraryCatalog(profileName) {
  const profile = profileFor(profileName);
  const sourceLimit = profile.catalogLimit === 24 ? profile.catalogLimit + 1 : profile.catalogLimit;
  return catalog.slice(0, sourceLimit + demoUnrequestedIds.size).filter((item) => !demoRequestOnlyIds.has(item.id) && !demoUnrequestedIds.has(item.id));
}

function demoLibraryContains(id, title, profileName) {
  const item = findCatalog(id, title);
  return demoLibraryCatalog(profileName).some((entry) => entry.id === item.id);
}

const users = ['Sven', 'Jules', 'Mira', 'Noor', 'Elian', 'Robin', 'Lena', 'Mats', 'Iris', 'Theo', 'Sam', 'Ayla', 'Finn', 'Nika', 'Owen', 'Pia', 'Ravi', 'Liv', ...Array.from({ length: 42 }, (_, index) => `Member ${String(index + 1).padStart(2, '0')}`)];
const platforms = ['Plex Web', 'Apple TV', 'Android TV', 'Roku', 'Plexamp', 'iPad', 'PlayStation', 'Xbox', 'Android phone', 'Smart TV'];
const serviceNames = ['Plex', 'Tautulli', 'Jellyseerr', 'Wizarr', 'Cleanuparr', 'Tdarr', 'Prowlarr', 'Bazarr', 'Sonarr', 'Radarr', 'qBittorrent', 'SABnzbd', 'Unraid', 'TMDb', 'OMDb'];

const daysAgo = (days, hour = 12) => new Date(Date.now() - days * dayMs + hour * 3600000).toISOString();
const daysFromNow = (days, hour = 12) => new Date(Date.now() + days * dayMs + hour * 3600000).toISOString();
const event = (title, detail, source, at, type = 'status_changed') => ({ title, detail, source, at, type });

function episodeTemplate(item, seasonNumber, episodeNumber) {
  const index = (Number(item.id) + seasonNumber * 17 + episodeNumber * 7) % 12;
  const names = ['The First Trace', 'Low Water Mark', 'A Room With Weather', 'The Long Return', 'Instructions for Leaving', 'A Small Bright Machine', 'The Unfinished Map', 'Under the Same Sky', 'A Door in the Orchard', 'The Work of Memory', 'No Signal at Noon', 'The Shape of Tomorrow'];
  const descriptions = ['A new clue changes the route, but the team cannot agree on what it means.', 'An old decision resurfaces when an unexpected visitor arrives after dark.', 'The group tests a fragile theory while the world outside carries on as usual.', 'A practical problem forces everyone to reveal what they have been keeping quiet.', 'A familiar place becomes strange when the evidence is viewed from another angle.', 'The search takes a personal turn and leaves one member with an impossible choice.'];
  return { name: `S${String(seasonNumber).padStart(2, '0')} E${String(episodeNumber).padStart(2, '0')} · ${names[index]}`, overview: descriptions[(index + seasonNumber + episodeNumber) % descriptions.length], airDateUtc: daysFromNow((seasonNumber - 1) * 18 + episodeNumber - 7, 18), runtime: item.runtime, stillPath: item.poster };
}

function episodeTitle(item, seasonNumber, episodeNumber) { return episodeTemplate(item, seasonNumber, episodeNumber).name; }

function mediaItem(item, index, addedDays = index + 1) {
  return { ratingKey: 'demo-' + item.id, tmdbId: item.id, title: item.title, year: item.year, type: item.mediaType === 'tv' ? 'show' : 'movie', mediaType: item.mediaType, library: item.mediaType === 'tv' ? 'Series' : 'Movies', thumb: item.poster, poster: item.poster, episodeCount: item.mediaType === 'tv' ? item.seasons * item.episodesPerSeason : 0, seasonCount: item.mediaType === 'tv' ? item.seasons : 0, recentDetail: addedDays <= 14 ? 'Added ' + addedDays + ' days ago' : 'In library · added ' + addedDays + ' days ago', addedAt: daysAgo(addedDays) };
}

function stream(item, user, progress, mode, quality, device, client, index) {
  const tvEpisode = item.mediaType === 'tv' ? episodeTitle(item, index % item.seasons + 1, index % item.episodesPerSeason + 1) : '';
  return { server: index % 2 ? 'Secondary server' : 'Primary server', quality, mode, user, title: tvEpisode || item.title, ratingKey: 'demo-' + item.id, grandparentRatingKey: item.mediaType === 'tv' ? 'demo-' + item.id : '', tmdbId: item.id, mediaType: item.mediaType, device, client, videoCodec: index % 2 ? 'HEVC' : 'H.264', audioCodec: index % 3 ? 'EAC3' : 'AAC', bandwidth: 4200 + index * 1850, duration: item.runtime * 60, progress };
}

function historyRows(profileName) {
  const profile = profileFor(profileName);
  const libraryCatalog = demoLibraryCatalog(profileName);
  return Array.from({ length: profile.historyCount }, (_, index) => {
    const item = libraryCatalog[(index * 11) % libraryCatalog.length]; const user = users[(index * 7) % profile.userCount];
    const season = item.mediaType === 'tv' ? index % item.seasons + 1 : 0; const episode = item.mediaType === 'tv' ? index % item.episodesPerSeason + 1 : 0;
    return { title: item.mediaType === 'tv' ? episodeTitle(item, season, episode) : item.title, seriesTitle: item.mediaType === 'tv' ? item.title : '', user, watchedAt: Math.floor((Date.now() - (index % 120) * dayMs - (index % 9) * 3600000) / 1000), duration: item.runtime * 60, platform: platforms[index % platforms.length], ratingKey: 'demo-' + item.id, grandparentRatingKey: item.mediaType === 'tv' ? 'demo-' + item.id : '' };
  });
}

function pipelineItems(profileName) {
  const profile = profileFor(profileName);
  const states = ['Completed', 'Downloading', 'Import failed', 'Stalled', 'Pending', 'Importing', 'Paused', 'Searching', 'Missing', 'Verifying'];
  return Array.from({ length: profile.pipelineCount }, (_, index) => {
    const slot = (index * 5) % profile.catalogLimit; const item = catalog[demoUnrequestedIds.has(catalog[slot].id) ? slot + 1 : slot]; const state = states[index % states.length]; const needsAction = ['Import failed', 'Stalled', 'Missing'].includes(state);
    const detail = item.mediaType === 'tv' ? episodeTitle(item, index % item.seasons + 1, index % item.episodesPerSeason + 1) : `Movie · ${item.year}`;
    const service = item.mediaType === 'tv' ? (index % 4 === 0 ? 'qBittorrent' : 'Sonarr') : (index % 4 === 0 ? 'qBittorrent' : 'Radarr'); const current = daysAgo((index % 45) / 2, 8 + index % 8);
    return { title: item.title, detail, service, state, progress: state === 'Completed' || state === 'Import failed' ? 100 : state === 'Pending' || state === 'Searching' || state === 'Missing' ? 0 : 15 + (index * 13) % 82, needsAction, sourceId: String(4200 + index), queueId: String(7800 + index), actionId: String(2300 + index), actionType: item.mediaType === 'tv' ? 'series' : 'movie', tmdbId: item.id, mediaType: item.mediaType, torrentHash: 'demo' + String(index).padStart(4, '0') + 'deadbeef', importAction: needsAction && state === 'Import failed', blocklistAction: needsAction, retryAction: state === 'Missing' ? '' : 'search', openUrl: '', updated: current, events: [event('Queue item created', 'Added to ' + service, service, daysAgo(index % 50 + 3, 10), 'created'), event('Release selected', 'A release matched the configured quality profile', service, daysAgo(index % 35 + 2, 11), 'selected'), ...(state === 'Completed' ? [event('Available in library', 'Import completed successfully', service, daysAgo(index % 14 + 1, 14), 'completed')] : [event(state, state === 'Import failed' ? 'Manual action is required' : detail, service, current)])] };
  });
}

function requestItems(profileName) {
  const profile = profileFor(profileName);
  const states = ['Available', 'Approved', 'Pending', 'Downloading', 'Requested', 'Searching', 'Declined', 'Available', 'Pending', 'Approved'];
  let approvalIndex = 0;
  let approvedIndex = 0;
  return Array.from({ length: profile.requestCount }, (_, index) => {
    let state = states[index % states.length];
    if (['Pending', 'Requested'].includes(state)) {
      if (approvalIndex >= profile.approvalCount) state = index % 2 ? 'Searching' : 'Available';
      else approvalIndex += 1;
    }
    const requestOnly = ['Pending', 'Requested', 'Approved'].includes(state);
    const catalogPool = requestOnly ? demoRequestOnlyItems : demoLibraryCatalog(profileName);
    const item = ['Pending', 'Requested'].includes(state)
      ? catalogPool[(approvalIndex - 1) % catalogPool.length]
      : state === 'Approved'
        ? catalogPool[(approvedIndex += 1) % catalogPool.length]
        : catalogPool[(index * 3) % catalogPool.length];
    const requester = users[(index * 7) % profile.userCount]; const age = (index * 7) % 150;
    const detail = item.mediaType === 'tv' ? `Series · ${item.seasons} seasons` : `Movie · ${item.year}`; const ageLabel = age === 0 ? 'Just now' : age === 1 ? 'Yesterday' : age + ' days ago';
    return { title: item.title, requester, state, detail, age: ageLabel, requestId: String(1200 + index), externalId: String(1200 + index), tmdbId: item.id, mediaType: item.mediaType, updated: daysAgo(age || 0.2, 9 + index % 10), createdAt: daysAgo(age + 2, 11), events: [event('Request received', requester + ' requested access', 'Jellyseerr', daysAgo(age + 5, 11), 'created'), ...(age % 3 === 0 ? [event('Metadata matched', 'Matched to the demo catalog', 'Jellyseerr', daysAgo(age + 4, 12), 'matched')] : []), ...(state === 'Pending' || state === 'Requested' ? [event('Awaiting review', 'Still waiting for approval', 'Jellyseerr', daysAgo(age, 12))] : [event(state, state === 'Available' ? 'Request fulfilled' : 'Request status updated', 'Jellyseerr', daysAgo(Math.max(age - 1, 0.1), 15))]) ] };
  });
}

function serviceEvents(name, state, detail, index) {
  return [event('Health check', state + ' · ' + detail, name, daysAgo(index / 4 + 0.2, 8 + index % 8), 'health_check'), event(state === 'Healthy' ? 'Recovered' : 'Attention required', detail, name, daysAgo(index + 3.5, 9 + index % 6), state === 'Healthy' ? 'recovered' : 'attention'), event('Configuration refreshed', 'Connection settings verified', name, daysAgo(index + 8, 13), 'configured'), event('Metrics collected', 'Latest counters are available for this service', name, daysAgo(index + 12, 16), 'metrics')];
}

function demoServices(profileName) {
  const profile = profileFor(profileName); const mediaCount = demoLibraryCatalog(profileName).length; const historyCount = profile.historyCount; const requestCount = profile.requestCount;
  const details = { Plex: ['Healthy', `2 servers · ${profile.streamCount} streams`], 'Plex library': ['Healthy', `${mediaCount} available media items · ${profile.recentLimit} recently added`], Tautulli: ['Healthy', `${historyCount} plays tracked over ${profile.historyCount / 6} days`], Jellyseerr: ['Healthy', `${requestCount} active requests`], Wizarr: ['Healthy', `${profile.userCount} users · ${Math.round(profile.userCount * 0.4)} available invites`], Cleanuparr: ['Attention', '14 strikes · 38 items removed in 24h'], Tdarr: ['Healthy', 'v3.1.01 · 4 nodes · 12 transcodes queued'], Prowlarr: ['Attention', '11 enabled of 12 indexers'], Bazarr: ['Attention', '38 subtitles wanted · 1 provider issue'], Sonarr: ['Healthy', `${Math.round(profile.pipelineCount * 0.55)} queue items · ${Math.round(profile.catalogLimit * 0.32)} series monitored`], Radarr: ['Attention', '8 imports need action'], qBittorrent: ['Healthy', '21 active torrents · 6 paused'], SABnzbd: ['Healthy', '7 active downloads · 0 errors'], Unraid: ['Healthy', '184 days uptime · 3.1 TB free'], TMDb: ['Healthy', 'Demo metadata catalog available'], OMDb: ['Healthy', 'Demo ratings catalog available'] };
  const metrics = { Wizarr: { usersTotal: profile.userCount, invitationsTotal: profile.userCount * 2 + 8, invitationsAvailable: Math.round(profile.userCount * 0.4) }, Cleanuparr: { eventsTotal: 84, strikesTotal: 14, itemsRemoved: 38, timeframeHours: 24 }, Tdarr: { tdarrNodes: 4, transcodeQueued: 12, transcodeErrors: 1, healthCheckQueued: 8, healthCheckErrors: 0 }, Prowlarr: { indexersTotal: 12, indexersEnabled: 11, healthIssues: 1 }, Bazarr: { wantedEpisodes: 31, wantedMovies: 7, providerIssues: 1, healthIssues: 1 }, Unraid: { totalStorage: '34 TB', usedStorage: '30.9 TB', freeStorage: '3.1 TB', disks: ['disk1', 'disk2', 'disk3', 'disk4'].map((name, index) => ({ name, size: '8 TB', status: 'healthy', temperature: 33 + index })) } };
  return serviceNames.map((name, index) => { const [state, detail] = details[name]; return { name, state, detail, checkedAt: daysAgo(index / 24, 10 + index % 5), metrics: metrics[name], events: serviceEvents(name, state, detail, index) }; });
}

function demoMedia(profileName) { const profile = profileFor(profileName); const allMedia = demoLibraryCatalog(profileName).map((item, index) => mediaItem(item, index, index + 2)); return { media: allMedia.slice(0, profile.recentLimit), allMedia }; }

const demoDiscoveryItems = catalog.map((item, index) => ({ id: item.id, title: item.title, name: item.mediaType === 'tv' ? item.title : undefined, media_type: item.mediaType, poster: item.poster, poster_path: item.poster, overview: item.overview, release_date: item.mediaType === 'movie' ? String(item.year) + '-09-' + String(index % 27 + 1).padStart(2, '0') : '', first_air_date: item.mediaType === 'tv' ? String(item.year) + '-02-' + String(index % 27 + 1).padStart(2, '0') : '', vote_average: item.voteAverage }));

export function createDemoDashboard(profileName = defaultDemoProfile) {
  const profile = profileFor(profileName); const media = demoMedia(profileName); const pipeline = pipelineItems(profileName); const requests = requestItems(profileName); const services = demoServices(profileName);
  const streamModes = ['Direct Play', 'Transcoding', 'Direct Stream']; const qualities = ['4K', '1080p', '720p']; const devices = ['Living room TV', 'Bedroom TV', 'Projector', 'Tablet', 'Office monitor', 'Kitchen TV', 'Phone', 'Cinema room', 'Guest room', 'Study']; const clients = ['Apple TV', 'Android TV', 'Plex Web', 'iPad', 'Roku', 'Xbox', 'Android phone', 'PlayStation'];
  const libraryCatalog = demoLibraryCatalog(profileName);
  const streams = Array.from({ length: profile.streamCount }, (_, index) => stream(libraryCatalog[(index * 9 + 1) % libraryCatalog.length], users[index % profile.userCount], 12 + (index * 13) % 83, streamModes[index % streamModes.length], qualities[index % qualities.length], devices[index % devices.length], clients[index % clients.length], index));
  return { mode: 'demo', demoProfile: normalizeDemoProfile(profileName), generatedAt: new Date().toISOString(), runtime: { host: 'media-nas', uptime: '184d 7h uptime', processUptime: 184 * 86400 + 7 * 3600, processMemory: 188, hostMemory: { total: 65536, free: 39936, used: 25600 }, loadAverage: [1.35, 1.12, 0.88], cpuCount: 12 }, links: { plex: '', tautulli: '', jellyseerr: '', wizarr: '', cleanuparr: '', tdarr: '', prowlarr: '', bazarr: '', sonarr: '', radarr: '', qbittorrent: '', sabnzbd: '', unraid: '' }, health: { label: 'Attention required', online: 18, total: 20, freeStorage: '3.1 TB' }, streams, pipeline, requests, requestedMedia: requests.filter((item) => ['Pending', 'Requested', 'Approved'].includes(item.state)), missingMedia: pipeline.filter((item) => item.state === 'Missing'), ...media, analytics: { history: historyRows(profileName), summary: { plays: profile.historyCount * 6.75, users: profile.userCount, totalMinutes: profile.historyCount * 303, periodDays: profile.historyCount / 6 } }, services, activity: [], alerts: [] };
}

function findCatalog(id, title = '') { return catalog.find((item) => String(item.id) === String(id)) || catalog.find((item) => item.title.toLowerCase() === String(title).toLowerCase()) || catalog[0]; }

export function demoDiscovery(query = '', page = 1, profileName = defaultDemoProfile) {
  const profile = profileFor(profileName); const available = demoDiscoveryItems.slice(0, profile.catalogLimit); const normalized = String(query || '').trim().toLowerCase(); const filtered = normalized ? available.filter((item) => item.title.toLowerCase().includes(normalized) || item.overview.toLowerCase().includes(normalized)) : available; const pageNumber = Math.max(1, Number(page) || 1); const pageSize = 6;
  return { mode: normalized ? 'search' : 'trending', query: String(query || ''), page: pageNumber, total_pages: Math.max(1, Math.ceil(filtered.length / pageSize)), total_results: filtered.length, results: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize) };
}

export function demoCalendar(from, to, profileName = defaultDemoProfile) {
  const profile = profileFor(profileName); const start = from || new Date().toISOString().slice(0, 10); const end = to || new Date(Date.now() + 14 * dayMs).toISOString().slice(0, 10); const entries = [];
  for (let offset = profile.calendarStart; offset <= profile.calendarEnd; offset += 1) {
    const count = profile.calendarMinimum + Math.abs(offset) % profile.calendarSpread;
    for (let slot = 0; slot < count; slot += 1) {
      const safeIndex = Math.abs(offset * 5 + slot * 7); const item = catalog[(offset * 5 + slot * 7 + 1000) % catalog.length]; const date = daysFromNow(offset, 8 + slot * 4 + safeIndex % 3); const type = item.mediaType === 'tv' ? 'episode' : 'movie'; const season = item.mediaType === 'tv' ? safeIndex % item.seasons + 1 : 0; const episode = item.mediaType === 'tv' ? safeIndex % item.episodesPerSeason + 1 : 0;
      entries.push({ title: item.title, date, detail: type === 'episode' ? episodeTitle(item, season, episode) : 'Movie release · ' + item.year, service: type === 'episode' ? 'Sonarr' : 'Radarr', type, mediaType: item.mediaType, tmdbId: item.id, sourceId: String(6000 + (offset + 60) * 5 + slot) });
    }
  }
  return { from: start, to: end, entries: entries.filter((entry) => entry.date >= start + 'T00:00:00' && entry.date <= end + 'T23:59:59').sort((a, b) => new Date(a.date) - new Date(b.date)) };
}

export function demoTitleDetails(id, type = 'movie') {
  const item = findCatalog(id); const mediaType = type === 'tv' || item.mediaType === 'tv' ? 'tv' : 'movie';
  return { id: item.id, tmdb_id: item.id, media_type: mediaType, title: mediaType === 'movie' ? item.title : undefined, name: mediaType === 'tv' ? item.title : undefined, original_title: item.title, original_name: item.title, overview: item.overview, poster_path: item.poster, backdrop_path: item.poster, release_date: mediaType === 'movie' ? String(item.year) + '-09-10' : '', first_air_date: mediaType === 'tv' ? String(item.year) + '-02-03' : '', genres: item.genres.map((name, index) => ({ id: index + 1, name })), runtime: mediaType === 'movie' ? item.runtime : undefined, episode_run_time: mediaType === 'tv' ? [item.runtime] : [], number_of_seasons: mediaType === 'tv' ? item.seasons : undefined, number_of_episodes: mediaType === 'tv' ? item.seasons * item.episodesPerSeason : undefined, vote_average: item.voteAverage, vote_count: item.voteCount, credits: { cast: Array.from({ length: 8 }, (_, index) => { const name = castNames[(Number(item.id) + index) % castNames.length]; return { id: index + 1, name, character: ['Mara Vale', 'Ivo Chen', 'Nell Aran', 'Dr. Soren', 'June Pike', 'Rafi North', 'Elise Ward', 'Cal Rowan'][index] }; }) } };
}

export function demoRatings(id) { const item = findCatalog(id); const rating = item.rating; return { rottenTomatoes: { critics: rating.rottenTomatoes, audience: Math.max(0, rating.rottenTomatoes - 3) }, imdb: { score: rating.imdb, votes: item.voteCount, url: '' }, metacritic: { score: rating.metacritic } }; }

export function demoSeriesAvailability(id, title = '', profileName = defaultDemoProfile) {
  const item = findCatalog(id, title); const tracked = demoLibraryContains(id, title, profileName); const seasons = Array.from({ length: item.seasons || 3 }, (_, seasonIndex) => { const seasonNumber = seasonIndex + 1; const episodes = Array.from({ length: item.episodesPerSeason || 8 }, (_, episodeIndex) => { const episodeNumber = episodeIndex + 1; const episode = episodeTemplate(item, seasonNumber, episodeNumber); return { id: 910000 + Number(item.id) + seasonNumber * 100 + episodeNumber, episodeNumber, title: episode.name, airDateUtc: episode.airDateUtc, overview: episode.overview, runtime: item.runtime, hasFile: tracked && (episodeNumber + seasonNumber) % 5 !== 0, monitored: tracked, source: tracked ? 'sonarr' : 'tmdb', queue: tracked && (episodeNumber + seasonNumber) % 9 === 0 ? { status: 'Downloading', detail: 'Season pack · ' + (38 + episodeNumber * 5) + '% complete', progress: 38 + episodeNumber * 5 } : tracked && (episodeNumber + seasonNumber) % 11 === 0 ? { status: 'Import warning', detail: 'Release needs manual review', progress: 100 } : null }; }); return { seasonNumber, episodeFileCount: episodes.filter((episode) => episode.hasFile).length, totalEpisodeCount: episodes.length, episodes }; });
  return { configured: true, series: { seriesId: Number(item.id) + 10000, source: tracked ? 'sonarr' : 'tmdb', seriesTitle: item.title, seasons } };
}

export function demoEpisodeDetails(id, seasonNumber, episodeNumber) { const item = findCatalog(id); const season = Math.max(1, Number(seasonNumber) || 1); const episodeNumberValue = Math.max(1, Number(episodeNumber) || 1); const episode = episodeTemplate(item, season, episodeNumberValue); return { id: 920000 + Number(item.id) + season * 100 + episodeNumberValue, name: episode.name, overview: episode.overview, air_date: episode.airDateUtc.slice(0, 10), runtime: item.runtime, still_path: item.poster, vote_average: Number((item.voteAverage - ((season + episodeNumberValue) % 3) / 10).toFixed(1)), guest_stars: [0, 1, 2].map((offset) => ({ name: castNames[(Number(item.id) + season + episodeNumberValue + offset) % castNames.length], character: ['Field archivist', 'Station engineer', 'Local historian'][offset] })) }; }

export function demoPlexLibraryMatch(id, title = '', profileName = defaultDemoProfile) { const item = findCatalog(id, title); return demoLibraryContains(id, title, profileName) ? { status: 'found', ratingKey: 'demo-' + item.id, title: item.title, library: item.mediaType === 'tv' ? 'Series' : 'Movies', webUrl: '' } : { status: 'missing', title: item.title, detail: 'Not in the demo library' }; }
export function demoArrMediaMatch(id, type = 'movie', title = '', profileName = defaultDemoProfile) { const item = findCatalog(id, title); return demoLibraryContains(id, title, profileName) ? (type === 'tv' ? { status: 'tracked', detail: 'Tracked in Sonarr', id: Number(item.id) + 10000 } : { status: 'available', detail: 'Movie file in Radarr', id: Number(item.id) + 20000 }) : { status: 'not-tracked', detail: type === 'tv' ? 'Not tracked in Sonarr' : 'Not added to Radarr' }; }
export function demoTitleHistory(id, title = '', profileName = defaultDemoProfile) { const item = findCatalog(id, title); return historyRows(profileName).filter((entry) => entry.ratingKey === 'demo-' + item.id || entry.grandparentRatingKey === 'demo-' + item.id).slice(0, 20); }
export function demoBazarrMediaStatus(id, type = 'movie') { const item = findCatalog(id); return type === 'tv' ? { status: 'missing', detail: `${(Number(item.id) % 4) + 1}/${item.episodesPerSeason || 8} episodes missing · Dutch, English`, missingCount: (Number(item.id) % 4) + 1, itemCount: item.episodesPerSeason || 8, languages: ['Dutch', 'English'] } : { status: 'complete', detail: 'Subtitles complete for tracked languages', itemCount: 1 }; }
export function demoMediaContext(ratingKey) { const item = catalog.find((entry) => 'demo-' + entry.id === String(ratingKey)); if (!item) return null; return { item: { ...mediaItem(item, 0, 2), title: item.title, type: item.mediaType === 'tv' ? 'show' : 'movie' } }; }

export function demoWizarrManagement(profileName = defaultDemoProfile) {
  const profile = profileFor(profileName);
  return { users: users.slice(0, profile.userCount).map((username, index) => ({ id: 500 + index, username, email: username.toLowerCase().replace(/\s+/g, '.') + '@example.test', server: index % 3 === 0 ? 'Secondary server' : 'Primary server', server_type: 'Plex', expires: index % 4 === 0 ? null : daysFromNow(30 + index, 12), created_at: daysAgo(180 - index * 2, 11) })), servers: [{ id: 1, name: 'Primary server', server_type: 'Plex' }, { id: 2, name: 'Secondary server', server_type: 'Plex' }], libraries: [{ id: 10, name: 'Movies', server_id: 1 }, { id: 11, name: 'Series', server_id: 1 }, { id: 12, name: 'Movies', server_id: 2 }, { id: 13, name: 'Series', server_id: 2 }] };
}
