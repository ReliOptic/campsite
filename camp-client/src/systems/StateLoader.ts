/**
 * Fire state identifiers from the Campsite domain model.
 */
export type FireState = 'bulssi' | 'modakbul' | 'deungbul' | 'yeongi' | 'jangjak';

export const FIRE_STATES: FireState[] = ['bulssi', 'modakbul', 'deungbul', 'yeongi', 'jangjak'];

/**
 * Shape of the camp.json data injected by the CLI via window.CAMP_STATE.
 */
export interface ProjectEntry {
  name: string;
  animal?: string;
  fire_state: string;
  last_activity: string;
  participant_count: number;
  status?: string;
}

export interface ParticipantEntry {
  name: string;
  status: 'active' | 'ended' | 'error';
  startedAt?: string;
  pid?: number;
  lastCommit?: string;
}

export interface EventEntry {
  timestamp: string;
  type: string;
  description: string;
  source: string;
}

export interface GitSummary {
  branch: string;
  recentCommits: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface RecoveryData {
  absenceSeconds: number;
  absenceHuman: string;
  commitsDuringAbsence: number;
  eventsDuringAbsence: number;
  lastAgent: string;
  lastAgentStatus: string;
  topEvents: Array<{ time: string; desc: string }>;
}

export interface CampState {
  mission?: { title: string; status: string };
  fireState?: string;
  fireLabel?: string;
  nextAction?: string;
  projects?: ProjectEntry[];
  participants?: ParticipantEntry[];
  events?: EventEntry[];
  events_summary?: string[];
  last_session?: string;
  lastActivity?: string;
  gitSummary?: GitSummary;
  recovery?: RecoveryData;
  next_action?: string;
}

/**
 * Default fire state when no CAMP_STATE is present or readable.
 */
const DEFAULT_STATE: FireState = 'bulssi';

// Extend Window to accept injected camp state from the CLI.
declare global {
  interface Window {
    CAMP_STATE?: Record<string, unknown>;
  }
}

/**
 * StateLoader — reads window.CAMP_STATE injected by the CLI and surfaces
 * structured data for the dashboard UI.
 */
export class StateLoader {
  private readonly raw: CampState | null;

  constructor() {
    this.raw = StateLoader.parseWindowState();
  }

  private static parseWindowState(): CampState | null {
    try {
      const w = window as unknown as { CAMP_STATE?: unknown };
      if (!w.CAMP_STATE || typeof w.CAMP_STATE !== 'object') return null;
      return w.CAMP_STATE as CampState;
    } catch {
      return null;
    }
  }

  /**
   * Returns the fire state. Prefers top-level fireState, falls back to
   * first project's fire_state. Defaults to 'bulssi'.
   */
  getFireState(): FireState {
    // Top-level derived fire state (from firestate.sh)
    if (this.raw?.fireState) {
      const candidate = this.raw.fireState as FireState;
      if (FIRE_STATES.includes(candidate)) return candidate;
    }

    // Fallback: first project entry
    const project = this.raw?.projects?.[0];
    if (!project) return DEFAULT_STATE;

    const candidate = project.fire_state as FireState;
    if (FIRE_STATES.includes(candidate)) return candidate;

    return DEFAULT_STATE;
  }

  /** Returns the Korean fire state label. */
  getFireLabel(): string {
    return this.raw?.fireLabel ?? '';
  }

  /** Returns the mission title string, or a placeholder when none is set. */
  getMissionTitle(): string {
    return this.raw?.mission?.title ?? '첫 미션을 정해보세요';
  }

  /** Returns the mission status string. */
  getMissionStatus(): string {
    return this.raw?.mission?.status ?? '';
  }

  /** Returns the next action hint. */
  getNextAction(): string {
    return this.raw?.nextAction ?? this.raw?.next_action ?? '';
  }

  /** Returns the last session ISO timestamp, or null. */
  getLastSession(): string | null {
    return this.raw?.last_session ?? null;
  }

  /** Returns event summary strings (backward compat). */
  getEventsSummary(): string[] {
    return this.raw?.events_summary ?? [];
  }

  /** Returns structured event entries from collector. */
  getEvents(): EventEntry[] {
    return this.raw?.events ?? [];
  }

  /** Returns participant list. */
  getParticipants(): ParticipantEntry[] {
    return this.raw?.participants ?? [];
  }

  /** Returns git summary data. */
  getGitSummary(): GitSummary | null {
    return this.raw?.gitSummary ?? null;
  }

  /** Returns recovery/absence data if present. */
  getRecovery(): RecoveryData | null {
    return this.raw?.recovery ?? null;
  }

  /** Returns the last activity ISO timestamp. */
  getLastActivity(): string | null {
    return this.raw?.lastActivity ?? null;
  }

  /** Exposes the raw parsed state (null if unavailable). */
  getRaw(): CampState | null {
    return this.raw;
  }
}
