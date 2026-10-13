// TMDb refuses pages beyond 500, whatever total_pages says.
const TMDB_MAX_PAGE = 500;

export function mergeDiscoveryPages(pages) {
  const results = pages.flatMap((page) => page.results || []).filter((item, index, all) => item.id && all.findIndex((candidate) => candidate.id === item.id && candidate.media_type === item.media_type) === index);
  const totalPages = Math.max(0, ...pages.map((page) => Number(page.total_pages) || 0));
  return { results, total_pages: Math.min(totalPages, TMDB_MAX_PAGE) };
}
