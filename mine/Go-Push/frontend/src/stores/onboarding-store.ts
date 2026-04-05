import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Vibe,
  Weight,
  Scene,
  MicroActionSignal,
  OnboardingStep,
  OnboardingSignals,
} from '@/types/onboarding.types';
import type { IdentityRead } from '@/types/identity.types';

type RevealPhase = 'loading' | 'narrative' | 'boss' | 'quest' | 'complete';

interface OnboardingState {
  step: OnboardingStep;
  signals: OnboardingSignals;
  stepStartedAt: number;
  onboardingStartedAt: number;
  stepDurations: number[];
  identityRead: IdentityRead | null;
  isLoading: boolean;
  revealPhase: RevealPhase | null;

  setVibe: (vibe: Vibe) => void;
  setWeight: (weight: Weight) => void;
  setScene: (scene: Scene) => void;
  setMicroAction: (action: MicroActionSignal) => void;
  setIdentityRead: (read: IdentityRead) => void;
  setLoading: (loading: boolean) => void;
  setRevealPhase: (phase: RevealPhase) => void;
  nextStep: () => void;
  reset: () => void;
}

const initialSignals: OnboardingSignals = {
  vibe: null,
  weight: null,
  scene: null,
  microAction: null,
  timingMeta: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      signals: { ...initialSignals },
      stepStartedAt: Date.now(),
      onboardingStartedAt: Date.now(),
      stepDurations: [],
      identityRead: null,
      isLoading: false,
      revealPhase: null,

      setVibe: (vibe) =>
        set((s) => ({ signals: { ...s.signals, vibe } })),

      setWeight: (weight) =>
        set((s) => ({ signals: { ...s.signals, weight } })),

      setScene: (scene) =>
        set((s) => ({ signals: { ...s.signals, scene } })),

      setMicroAction: (action) =>
        set((s) => ({ signals: { ...s.signals, microAction: action } })),

      setIdentityRead: (read) => set({ identityRead: read }),

      setLoading: (loading) => set({ isLoading: loading }),

      setRevealPhase: (phase) => set({ revealPhase: phase }),

      nextStep: () => {
        const { step, stepStartedAt, stepDurations } = get();
        const elapsed = Date.now() - stepStartedAt;
        const newDurations = [...stepDurations, elapsed];

        if (step < 5) {
          set({
            step: (step + 1) as OnboardingStep,
            stepStartedAt: Date.now(),
            stepDurations: newDurations,
          });
        } else {
          const { onboardingStartedAt, signals } = get();
          set({
            stepDurations: newDurations,
            signals: {
              ...signals,
              timingMeta: {
                totalOnboardingMs: Date.now() - onboardingStartedAt,
                stepDurations: newDurations,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                localHour: new Date().getHours(),
              },
            },
          });
        }
      },

      reset: () =>
        set({
          step: 1,
          signals: { ...initialSignals },
          stepStartedAt: Date.now(),
          onboardingStartedAt: Date.now(),
          stepDurations: [],
          identityRead: null,
          isLoading: false,
          revealPhase: null,
        }),
    }),
    {
      name: 'go-push-onboarding',
      skipHydration: true,
    },
  ),
);
