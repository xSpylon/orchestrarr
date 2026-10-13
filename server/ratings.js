export function imdbIdFromUrl(url = '') {
  return String(url).match(/tt\d+/)?.[0] || '';
}

function number(value) {
  const parsed = Number(String(value ?? '').replace(/[,%]/g, ''));
  return value === undefined || value === null || value === '' || value === 'N/A' || !Number.isFinite(parsed) ? undefined : parsed;
}

function compact(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== ''));
}

// Jellyseerr knows Rotten Tomatoes (critics, audience, link); OMDb knows Metacritic and the IMDb rating with votes.
// A missing value is left out rather than shown as 0, but a real 0% Tomatometer stays.
export function normalizeRatings({ jellyseerr, omdb, imdbId = '' } = {}) {
  const ratings = {};
  const omdbValid = omdb?.Response === 'True';
  const rt = jellyseerr?.rt;
  const omdbRt = omdbValid ? omdb.Ratings?.find((rating) => rating.Source === 'Rotten Tomatoes')?.Value : undefined;
  const rottenTomatoes = compact({ critics: number(rt?.criticsScore) ?? number(omdbRt), audience: number(rt?.audienceScore), url: rt?.url });
  if (rottenTomatoes.critics !== undefined || rottenTomatoes.audience !== undefined) ratings.rottenTomatoes = rottenTomatoes;
  const id = imdbId || imdbIdFromUrl(jellyseerr?.imdb?.url);
  const imdb = compact({ score: number(omdbValid ? omdb.imdbRating : undefined) ?? number(jellyseerr?.imdb?.criticsScore), votes: number(omdbValid ? omdb.imdbVotes : undefined), url: id ? `https://www.imdb.com/title/${id}` : undefined });
  if (imdb.score !== undefined) ratings.imdb = imdb;
  const metascore = number(omdbValid ? omdb.Metascore : undefined);
  if (metascore !== undefined) ratings.metacritic = { score: metascore };
  return ratings;
}
