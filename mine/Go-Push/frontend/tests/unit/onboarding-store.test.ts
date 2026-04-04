import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore } from '@/stores/onboarding-store';

describe('onboarding-store', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it('starts at step 1 with null signals', () => {
    const state = useOnboardingStore.getState();
    expect(state.step).toBe(1);
    expect(state.signals.vibe).toBeNull();
    expect(state.signals.weight).toBeNull();
    expect(state.signals.scene).toBeNull();
    expect(state.signals.microAction).toBeNull();
    expect(state.signals.timingMeta).toBeNull();
  });

  it('setVibe updates signals.vibe', () => {
    useOnboardingStore.getState().setVibe('heavy');
    expect(useOnboardingStore.getState().signals.vibe).toBe('heavy');
  });

  it('setWeight updates signals.weight', () => {
    useOnboardingStore.getState().setWeight('health');
    expect(useOnboardingStore.getState().signals.weight).toBe('health');
  });

  it('setScene updates signals.scene', () => {
    useOnboardingStore.getState().setScene('ocean');
    expect(useOnboardingStore.getState().signals.scene).toBe('ocean');
  });

  it('setMicroAction updates signals.microAction', () => {
    const action = { completed: true, durationMs: 5000, hesitationMs: 1200 };
    useOnboardingStore.getState().setMicroAction(action);
    expect(useOnboardingStore.getState().signals.microAction).toEqual(action);
  });

  it('nextStep increments step from 1 to 2', () => {
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().step).toBe(2);
  });

  it('nextStep records step duration', () => {
    useOnboardingStore.getState().nextStep();
    const durations = useOnboardingStore.getState().stepDurations;
    expect(durations).toHaveLength(1);
    expect(durations[0]).toBeGreaterThanOrEqual(0);
  });

  it('nextStep advances through all 5 steps', () => {
    const store = useOnboardingStore.getState;
    store().nextStep(); // 1 → 2
    store().nextStep(); // 2 → 3
    store().nextStep(); // 3 → 4
    store().nextStep(); // 4 → 5
    expect(store().step).toBe(5);
    expect(store().stepDurations).toHaveLength(4);
  });

  it('nextStep at step 5 sets timingMeta instead of advancing', () => {
    const store = useOnboardingStore.getState;
    store().nextStep(); // 1 → 2
    store().nextStep(); // 2 → 3
    store().nextStep(); // 3 → 4
    store().nextStep(); // 4 → 5
    store().nextStep(); // 5 → timingMeta

    const { signals, stepDurations } = store();
    expect(signals.timingMeta).not.toBeNull();
    expect(signals.timingMeta!.stepDurations).toHaveLength(5);
    expect(signals.timingMeta!.totalOnboardingMs).toBeGreaterThanOrEqual(0);
    expect(typeof signals.timingMeta!.timezone).toBe('string');
    expect(signals.timingMeta!.localHour).toBeGreaterThanOrEqual(0);
    expect(signals.timingMeta!.localHour).toBeLessThan(24);
    expect(stepDurations).toHaveLength(5);
  });

  it('reset restores initial state', () => {
    const store = useOnboardingStore.getState;
    store().setVibe('restless');
    store().setWeight('time');
    store().nextStep();
    store().nextStep();
    store().reset();

    const state = store();
    expect(state.step).toBe(1);
    expect(state.signals.vibe).toBeNull();
    expect(state.signals.weight).toBeNull();
    expect(state.stepDurations).toHaveLength(0);
    expect(state.identityRead).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('setIdentityRead stores identity', () => {
    const identity = {
      narrative: 'test narrative',
      boss: {
        id: 'fog' as const,
        name: 'The Fog',
        description: 'test',
        hp: 800,
        maxHp: 800,
        weakness: 'First small action',
        visual: 'misty' as const,
      },
      firstQuest: {
        id: 'q1',
        description: 'test quest',
        durationSeconds: 60,
        xpReward: 50,
        bossId: 'fog',
      },
      memoryShard: {
        compressedTokens: 0,
        rawTokens: 0,
        compressionRatio: 0,
        promptCacheHit: false,
      },
    };

    useOnboardingStore.getState().setIdentityRead(identity);
    expect(useOnboardingStore.getState().identityRead).toEqual(identity);
  });

  it('setLoading toggles isLoading', () => {
    useOnboardingStore.getState().setLoading(true);
    expect(useOnboardingStore.getState().isLoading).toBe(true);
    useOnboardingStore.getState().setLoading(false);
    expect(useOnboardingStore.getState().isLoading).toBe(false);
  });
});
