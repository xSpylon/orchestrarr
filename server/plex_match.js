export function xmlAttribute(xml, tag, attribute) {
  const expression = attribute === undefined
    ? new RegExp(`\\b${tag}="([^"]*)"`, 'i')
    : new RegExp(`<${tag}[^>]*\\b${attribute}="([^"]*)"`, 'i');
  const match = xml.match(expression);
  return decodeXmlEntities(match?.[1] || '');
}

const namedEntities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

function decodeXmlEntities(value) {
  return value.replace(/&(?:#x([\da-f]+)|#(\d+)|(amp|quot|apos|lt|gt));/gi, (entity, hex, decimal, name) => {
    if (name) return namedEntities[name.toLowerCase()];
    const codePoint = Number.parseInt(hex || decimal, hex ? 16 : 10);
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}

// Plex search is fuzzy: hits whose TMDb ID differs are other titles, not doubt.
// Only a same-type hit without any TMDb ID leaves the match unresolved.
export function resolvePlexLibraryMatch(xml, mediaType, tmdbId) {
  if (!tmdbId) return { status: 'unresolved', detail: 'TMDb ID is required for an exact Plex match' };
  const tag = mediaType === 'tv' ? 'Directory' : 'Video';
  const expectedType = mediaType === 'tv' ? 'show' : 'movie';
  const candidates = [...xml.matchAll(new RegExp(`<${tag}\\b[^>]*(?:\\/\\s*>|>[\\s\\S]*?<\\/${tag}\\s*>)`, 'gi'))]
    .map((match) => match[0])
    .filter((node) => {
      const sectionType = xmlAttribute(node, tag, 'librarySectionType').toLowerCase();
      return xmlAttribute(node, tag, 'type').toLowerCase() === expectedType && (!sectionType || sectionType === expectedType);
    })
    .map((node) => {
      const ids = [...node.matchAll(/<(?:Guid|Directory)\b[^>]*\bid="([^"]+)"/gi)].map((entry) => entry[1]);
      return { node, tmdb: ids.find((id) => id.startsWith('tmdb://'))?.slice('tmdb://'.length) || '' };
    });
  const match = candidates.find((candidate) => candidate.tmdb === String(tmdbId));
  if (match) return { status: 'found', library: xmlAttribute(match.node, tag, 'librarySectionTitle') || '', ratingKey: xmlAttribute(match.node, tag, 'ratingKey') || '' };
  if (candidates.some((candidate) => !candidate.tmdb)) return { status: 'unresolved', detail: 'Plex results could not be confirmed by TMDb ID' };
  return { status: 'missing' };
}

// app.plex.tv picks the best route to the server: local at home, remote access or relay elsewhere.
export function plexWebUrl(machineIdentifier, ratingKey) {
  if (!machineIdentifier || !ratingKey) return '';
  return `https://app.plex.tv/desktop/#!/server/${machineIdentifier}/details?key=${encodeURIComponent(`/library/metadata/${ratingKey}`)}`;
}
