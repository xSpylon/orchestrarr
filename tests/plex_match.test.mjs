import test from 'node:test';
import assert from 'node:assert/strict';
import { plexWebUrl, resolvePlexLibraryMatch, xmlAttribute } from '../server/plex_match.js';

const movie = (title, tmdb, extra = '') => `<Video type="movie" title="${title}" ratingKey="1" librarySectionTitle="Films" ${extra}>${tmdb ? `<Guid id="tmdb://${tmdb}" />` : ''}</Video>`;

test('fuzzy Plex hits with other TMDb IDs mean the title is missing', () => {
  const xml = `<Video type="episode" title="Hollywood Babylon"><Guid id="tmdb://162420" /></Video>${movie('Johnny English Strikes Again', 463272)}<Directory librarySectionType="1" type="tag" id="99917" />`;
  assert.deepEqual(resolvePlexLibraryMatch(xml, 'movie', '615777'), { status: 'missing' });
});

test('a hit with the same TMDb ID is found', () => {
  assert.deepEqual(resolvePlexLibraryMatch(movie('Babylon', 615777), 'movie', '615777'), { status: 'found', library: 'Films', ratingKey: '1' });
});

test('a same-type hit without a TMDb ID stays unresolved', () => {
  assert.equal(resolvePlexLibraryMatch(movie('Babylon', ''), 'movie', '615777').status, 'unresolved');
});

test('xmlAttribute decodes XML entities', () => {
  const xml = `<Video title="Frank&#39;s Team &amp; &quot;Friends&quot; &#x2014; &lt;Live&gt;" />`;
  assert.equal(xmlAttribute(xml, 'Video', 'title'), `Frank's Team & "Friends" — <Live>`);
});

test('plexWebUrl deep-links a library item through app.plex.tv, so it works off the local network', () => {
  assert.equal(plexWebUrl('abc123', '4567'), 'https://app.plex.tv/desktop/#!/server/abc123/details?key=%2Flibrary%2Fmetadata%2F4567');
  assert.equal(plexWebUrl('', '4567'), '');
});
