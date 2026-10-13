export function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function mediaTypeOf(value: Record<string, unknown>): 'movie' | 'tv' {
  const type = `${stringValue(value.mediaType)} ${stringValue(value.type)} ${stringValue(value.detail)}`.toLowerCase();
  return /\btv\b|series|episode|show/.test(type) ? 'tv' : 'movie';
}

export function titleKey(value: unknown): string {
  return stringValue(value).toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

/** The one TMDb result with the same type, title and (when known) year, or nothing when that is ambiguous. */
export function uniqueTmdbMatch(results: Array<Record<string, unknown>>, title: string, mediaType: 'movie' | 'tv', yearValue: unknown): string {
  const wantedTitle = titleKey(title);
  let matches = results.filter((result) => {
    const type = stringValue(result.media_type || (result.first_air_date ? 'tv' : 'movie'));
    return type === mediaType && titleKey(result.title || result.name) === wantedTitle;
  });
  const year = stringValue(yearValue).match(/\d{4}/)?.[0];
  if (year) matches = matches.filter((result) => stringValue(result.release_date || result.first_air_date).startsWith(year));
  return matches.length === 1 ? stringValue(matches[0].id) : '';
}
