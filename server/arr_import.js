// "Import now": finish an import Radarr/Sonarr is waiting on, for a download that is already complete.
// A failed download is not offered here; that one is for Blocklist.
export function canImportNow(record = {}) {
  return record.status === 'completed' && record.trackedDownloadStatus === 'warning' && ['importPending', 'importBlocked'].includes(record.trackedDownloadState);
}

// Turns the candidates from GET /manualimport into the files of a ManualImport command.
// A release Radarr could not match by name falls back to the movie the queue item belongs to; samples are skipped.
export function manualImportFiles(service, candidates = [], record = {}) {
  const usable = candidates.filter((candidate) => candidate.path && !(candidate.rejections || []).some((rejection) => /sample/i.test(rejection.reason || '')));
  const files = usable.map((candidate) => {
    const shared = { downloadId: record.downloadId, quality: candidate.quality, languages: candidate.languages, releaseGroup: candidate.releaseGroup, indexerFlags: candidate.indexerFlags || 0 };
    if (service === 'Radarr') {
      return { path: candidate.path, movieId: candidate.movie?.id || record.movieId, ...shared };
    }
    const episodeIds = (candidate.episodes || []).map((episode) => episode.id).filter(Boolean);
    if (!episodeIds.length) throw new Error(`Sonarr could not match the episodes in ${candidate.relativePath || candidate.path}. Import it manually in Sonarr.`);
    return { path: candidate.path, seriesId: candidate.series?.id || record.seriesId, episodeIds, ...shared };
  });
  if (!files.length || files.some((file) => !(file.movieId || file.seriesId))) throw new Error(`No importable files were found in this ${service} download.`);
  return files;
}
