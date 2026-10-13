import test from 'node:test';
import assert from 'node:assert/strict';
import { imdbIdFromUrl, normalizeRatings } from '../server/ratings.js';

const jellyseerr = {
  rt: { url: 'https://www.rottentomatoes.com/m/365_days_this_day_2022', criticsScore: 0, criticsRating: 'Rotten', audienceScore: 40 },
  imdb: { url: 'https://www.imdb.com/title/tt12996154', criticsScore: 2.7 }
};
const omdb = { Response: 'True', imdbRating: '2.6', imdbVotes: '21,334', Metascore: '17', Ratings: [{ Source: 'Rotten Tomatoes', Value: '3%' }] };

test('Rotten Tomatoes comes from Jellyseerr, keeping a 0% critics score and the audience score', () => {
  assert.deepEqual(normalizeRatings({ jellyseerr }).rottenTomatoes, { critics: 0, audience: 40, url: 'https://www.rottentomatoes.com/m/365_days_this_day_2022' });
});

test('OMDb supplies Metacritic and the IMDb rating with vote count', () => {
  const ratings = normalizeRatings({ jellyseerr, omdb, imdbId: 'tt12996154' });
  assert.deepEqual(ratings.metacritic, { score: 17 });
  assert.deepEqual(ratings.imdb, { score: 2.6, votes: 21334, url: 'https://www.imdb.com/title/tt12996154' });
});

test('without Jellyseerr, OMDb\'s Rotten Tomatoes critics score is used', () => {
  assert.deepEqual(normalizeRatings({ omdb, imdbId: 'tt1' }).rottenTomatoes, { critics: 3 });
});

test('missing values are left out instead of shown as zero', () => {
  const ratings = normalizeRatings({ omdb: { Response: 'True', imdbRating: 'N/A', Metascore: 'N/A', Ratings: [] } });
  assert.deepEqual(ratings, {});
  assert.deepEqual(normalizeRatings({}), {});
});

test('imdbIdFromUrl reads the tt id from an IMDb title URL', () => {
  assert.equal(imdbIdFromUrl('https://www.imdb.com/title/tt12996154'), 'tt12996154');
  assert.equal(imdbIdFromUrl(''), '');
});
