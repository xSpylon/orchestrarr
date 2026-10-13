// Validates the Access form and builds the body for Wizarr's POST /invitations.
// Wizarr 2.2's API has no custom code or Plex Home option (Wizarr picks the code), so those are not sent.
// "Never expires" is expressed by leaving expires_in_days out: Wizarr's validation rejects null.
export function wizarrInvitationBody(payload) {
  if (!Array.isArray(payload.server_ids) || !payload.server_ids.length || payload.server_ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new Error('Choose at least one valid media server');
  }
  const expiresInDays = payload.expires_in_days == null ? null : Number(payload.expires_in_days);
  if (expiresInDays !== null && ![1, 7, 30].includes(expiresInDays)) throw new Error('Invitation expiry must be 1, 7, 30 days, or never');
  const rawDuration = payload.duration == null || payload.duration === '' ? 'unlimited' : String(payload.duration);
  const duration = rawDuration === 'unlimited' ? rawDuration : String(Number(rawDuration));
  if (duration !== 'unlimited' && (!/^\d+$/.test(duration) || Number(duration) < 1)) throw new Error('Access duration must be unlimited or a positive number of days');
  const libraryIds = Array.isArray(payload.library_ids) ? payload.library_ids.filter((id) => Number.isInteger(id) && id > 0) : [];
  return {
    server_ids: payload.server_ids,
    ...(expiresInDays !== null ? { expires_in_days: expiresInDays } : {}),
    duration,
    unlimited: Boolean(payload.unlimited),
    allow_downloads: Boolean(payload.allow_downloads),
    allow_live_tv: Boolean(payload.allow_live_tv),
    allow_mobile_uploads: Boolean(payload.allow_mobile_uploads),
    library_ids: libraryIds
  };
}

// Wizarr returns invite links as a path (/j/CODE) because it does not know its public address.
// Joined onto the configured public invite URL; with none set, no link rather than one that only works on the LAN.
export function wizarrInviteLink(url = '', publicUrl = '') {
  if (/^https?:\/\//i.test(url)) return url;
  if (!url || !publicUrl) return '';
  return `${publicUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}
