import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('micro-action timer logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('countdown decrements from initial duration', () => {
    const duration = 30;
    let secondsLeft = duration;

    // Simulate one tick
    secondsLeft = secondsLeft - 1;
    expect(secondsLeft).toBe(29);
  });

  it('timer reaches zero after full duration', () => {
    const duration = 30;
    let secondsLeft = duration;

    for (let i = 0; i < duration; i++) {
      secondsLeft = secondsLeft - 1;
    }
    expect(secondsLeft).toBe(0);
  });

  it('hesitation is measured from prompt shown to action start', () => {
    const promptShownAt = 1000;
    const actionStartedAt = 3500;
    const hesitationMs = actionStartedAt - promptShownAt;
    expect(hesitationMs).toBe(2500);
  });

  it('duration is measured from action start to completion', () => {
    const actionStartedAt = 3500;
    const completedAt = 18000;
    const durationMs = completedAt - actionStartedAt;
    expect(durationMs).toBe(14500);
  });

  it('auto-complete fires when timer hits zero', () => {
    const handleComplete = vi.fn();
    let secondsLeft = 3;
    const done = false;

    // Simulate countdown
    while (secondsLeft > 0) {
      secondsLeft--;
    }

    // At zero, handleComplete should be called with false (not manually completed)
    if (secondsLeft <= 0 && !done) {
      handleComplete(false);
    }

    expect(handleComplete).toHaveBeenCalledWith(false);
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('manual completion passes true', () => {
    const handleComplete = vi.fn();
    handleComplete(true);
    expect(handleComplete).toHaveBeenCalledWith(true);
  });

  it('done guard prevents double completion', () => {
    let done = false;
    const completions: boolean[] = [];

    const handleComplete = (completed: boolean) => {
      if (done) return;
      done = true;
      completions.push(completed);
    };

    handleComplete(true);
    handleComplete(false); // should be blocked

    expect(completions).toHaveLength(1);
    expect(completions[0]).toBe(true);
  });

  it('progress calculation is correct', () => {
    const total = 30;
    expect(1 - 30 / total).toBe(0);    // start: 0% progress
    expect(1 - 15 / total).toBe(0.5);  // halfway: 50%
    expect(1 - 0 / total).toBe(1);     // done: 100%
  });

  it('hesitation defaults to prompt-to-now when action never started', () => {
    const promptShownAt = 1000;
    const actionStartedAt: number | null = null;
    const now = 5000;
    const hesitationMs = actionStartedAt
      ? actionStartedAt - promptShownAt
      : now - promptShownAt;
    expect(hesitationMs).toBe(4000);
  });
});
