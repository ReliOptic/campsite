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
  fire_state: string;
  last_activity: string;
  participant_count: number;
  status?: string;
}

export interface ParticipantEntry {
  name: string;
  status: 'active' | 'ended' | 'error';
}

export interface CampState {
  mission?: { title: string; status: string };
  projects?: ProjectEntry[];
  participants?: ParticipantEntry[];
  last_session?: string;
  events_summary?: string[];
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
   * Returns the fire state based on the first project's fire_state.
   * Defaults to 'bulssi' if state is missing or unrecognised.
   */
  getFireState(): FireState {
    const project = this.raw?.projects?.[0];
    if (!project) return DEFAULT_STATE;

    const candidate = project.fire_state as FireState;
    if (FIRE_STATES.includes(candidate)) return candidate;

    console.warn(
      `[StateLoader] Unrecognised fire_state "${project.fire_state}". Defaulting to "${DEFAULT_STATE}".`,
    );
    return DEFAULT_STATE;
  }

  /**
   * Returns the mission title string, or a placeholder when none is set.
   */
  getMissionTitle(): string {
    return this.raw?.mission?.title ?? '첫 미션을 정해보세요';
  }

  /** Returns the mission status string. */
  getMissionStatus(): string {
    return this.raw?.mission?.status ?? '';
  }

  /** Returns the next action hint. */
  getNextAction(): string {
    return this.raw?.next_action ?? '';
  }

  /** Returns the last session ISO timestamp, or null. */
  getLastSession(): string | null {
    return this.raw?.last_session ?? null;
  }

  /** Returns event summary strings. */
  getEventsSummary(): string[] {
    return this.raw?.events_summary ?? [];
  }

  /** Returns participant list. */
  getParticipants(): ParticipantEntry[] {
    return this.raw?.participants ?? [];
  }

  /** Exposes the raw parsed state (null if unavailable). */
  getRaw(): CampState | null {
    return this.raw;
  }
}
