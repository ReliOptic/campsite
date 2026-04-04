/**
 * Narrative.ts — Korean-language time and event formatting utilities.
 */

/**
 * Returns a Korean relative time string for a given ISO timestamp.
 *
 * Examples:
 *   "5분"      (< 1 hour)
 *   "3시간"    (< 24 hours)
 *   "어제"     (1 day ago)
 *   "3일"      (> 1 day)
 */
export function getRelativeTime(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  if (isNaN(then)) return '알 수 없는 시간';

  const now = Date.now();
  const diffMs = now - then;

  // In the future (clock skew / bad data) → treat as "방금"
  if (diffMs < 0) return '방금';

  const diffSec  = Math.floor(diffMs / 1_000);
  const diffMin  = Math.floor(diffSec  / 60);
  const diffHour = Math.floor(diffMin  / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffSec  < 60)  return '방금';
  if (diffMin  < 60)  return `${diffMin}분`;
  if (diffHour < 24)  return `${diffHour}시간`;
  if (diffDay  === 1) return '어제';
  return `${diffDay}일`;
}

/**
 * Trims and filters event descriptions so only clean, non-empty strings
 * are shown.  Returns at most `limit` entries (default 3).
 */
export function formatEventsSummary(events: string[], limit = 3): string[] {
  return events
    .map(e => e.trim())
    .filter(e => e.length > 0)
    .slice(0, limit);
}
