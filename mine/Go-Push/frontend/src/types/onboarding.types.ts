export type Vibe = 'calm' | 'heavy' | 'restless' | 'drift';
export type Weight = 'work' | 'health' | 'relationships' | 'identity' | 'time';
export type Scene = 'mountain' | 'ocean' | 'forest' | 'city' | 'space';

export interface MicroActionSignal {
  completed: boolean;
  durationMs: number;
  hesitationMs: number;
}

export interface TimingMeta {
  totalOnboardingMs: number;
  stepDurations: number[];
  timezone: string;
  localHour: number;
}

export interface OnboardingSignals {
  vibe: Vibe | null;
  weight: Weight | null;
  scene: Scene | null;
  microAction: MicroActionSignal | null;
  timingMeta: TimingMeta | null;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
