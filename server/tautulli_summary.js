/** First day (YYYY-MM-DD, local time) of a watch window of `days` ending today, for Tautulli's `after` filter. */
export function historyAfterDate(days, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

/** Plays, distinct users and watched minutes from a Tautulli get_history response. */
export function summarizeWatchHistory(data, periodDays) {
  const rows = Array.isArray(data) ? data : data?.data || data?.history || [];
  const plays = Number.isFinite(Number(data?.recordsFiltered)) ? Number(data.recordsFiltered) : rows.length;
  const users = new Set(rows.map((row) => row.user || row.friendly_name).filter(Boolean)).size;
  const seconds = rows.reduce((total, row) => total + Number(row.duration || row.play_duration || 0), 0);
  return { plays, users, totalMinutes: Math.round(seconds / 60), periodDays };
}
