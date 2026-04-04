/**
 * Narrative.ts — Korean-language time and event formatting utilities.
 */

import { RecoveryData } from './StateLoader';

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

/**
 * Formats a Korean human-readable absence summary from recovery data.
 *
 * Examples:
 *   "3시간 동안 claude가 5개 커밋을 만들었어요"
 *   "1일 동안 2개 이벤트가 있었어요"
 */
export function formatAbsenceSummary(recovery: RecoveryData): string {
  const parts: string[] = [];

  if (recovery.lastAgent && recovery.commitsDuringAbsence > 0) {
    parts.push(
      `${recovery.absenceHuman} 동안 ${recovery.lastAgent}가 ${recovery.commitsDuringAbsence}개 커밋을 만들었어요`,
    );
  } else if (recovery.commitsDuringAbsence > 0) {
    parts.push(
      `${recovery.absenceHuman} 동안 ${recovery.commitsDuringAbsence}개 커밋이 있었어요`,
    );
  } else if (recovery.eventsDuringAbsence > 0) {
    parts.push(
      `${recovery.absenceHuman} 동안 ${recovery.eventsDuringAbsence}개 이벤트가 있었어요`,
    );
  } else {
    parts.push(`${recovery.absenceHuman} 동안 조용했어요`);
  }

  if (recovery.lastAgent && recovery.lastAgentStatus) {
    const statusLabel = recovery.lastAgentStatus === 'finished' ? '정상 종료' :
      recovery.lastAgentStatus === 'crashed' ? '오류 발생' :
      recovery.lastAgentStatus === 'running' ? '아직 실행 중' :
      recovery.lastAgentStatus;
    parts.push(`${recovery.lastAgent}: ${statusLabel}`);
  }

  return parts.join('. ');
}

/**
 * Formats seconds into Korean relative time (for absence durations).
 */
export function formatDurationKo(seconds: number): string {
  if (seconds < 60) return '방금';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간`;
  return `${Math.floor(seconds / 86400)}일`;
}
