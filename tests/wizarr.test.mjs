import test from 'node:test';
import assert from 'node:assert/strict';
import { wizarrInvitationBody } from '../server/wizarr.js';

test('an invitation that never expires leaves expires_in_days out, because Wizarr rejects null', () => {
  const body = wizarrInvitationBody({ server_ids: [1], expires_in_days: null });
  assert.equal('expires_in_days' in body, false);
});

test('a 7-day invitation sends the number of days', () => {
  assert.equal(wizarrInvitationBody({ server_ids: [1], expires_in_days: 7 }).expires_in_days, 7);
});

test('invalid input is refused before anything is sent to Wizarr', () => {
  assert.throws(() => wizarrInvitationBody({ server_ids: [] }), /media server/);
  assert.throws(() => wizarrInvitationBody({ server_ids: [1], expires_in_days: 3 }), /1, 7, 30/);
  assert.throws(() => wizarrInvitationBody({ server_ids: [1], duration: '0' }), /positive number/);
});

test('only fields Wizarr 2.2 accepts are sent; a custom code and Plex Home are not part of its API', () => {
  assert.deepEqual(wizarrInvitationBody({ server_ids: [2], code: 'ABC', plex_home: true, library_ids: [3, 'x', -1] }), {
    server_ids: [2], duration: 'unlimited', unlimited: false, allow_downloads: false, allow_live_tv: false, allow_mobile_uploads: false, library_ids: [3]
  });
});

test('a relative invite path becomes a shareable link on the public invite URL', async () => {
  const { wizarrInviteLink } = await import('../server/wizarr.js');
  assert.equal(wizarrInviteLink('/j/3K2I02FCM5', 'https://join.example.com'), 'https://join.example.com/j/3K2I02FCM5');
  assert.equal(wizarrInviteLink('/j/ABC', 'https://example.com/wizarr/'), 'https://example.com/wizarr/j/ABC');
});

test('without a public invite URL there is no link, rather than an internal or relative one', async () => {
  const { wizarrInviteLink } = await import('../server/wizarr.js');
  assert.equal(wizarrInviteLink('/j/ABC', ''), '');
  assert.equal(wizarrInviteLink('https://wizarr.example.com/j/ABC', ''), 'https://wizarr.example.com/j/ABC');
});
