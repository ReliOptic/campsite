'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { config } from '@/config';
import { colors } from '@/config/theme';

const ACTIONS_BY_VIBE = {
  calm: 'Close your eyes. Take three slow breaths.',
  heavy: 'Stand up. Stretch your arms above your head.',
  restless: 'Open a window. Feel the air for 10 seconds.',
  drift: 'Write one word on paper. Any word.',
} as const;

export function MicroAction() {
  const { signals, setMicroAction, nextStep } = useOnboardingStore();
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(config.onboarding.microActionDurationSec);
  const [done, setDone] = useState(false);
  const promptShownAt = useRef(Date.now());
  const actionStartedAt = useRef<number | null>(null);

  const action = ACTIONS_BY_VIBE[signals.vibe ?? 'calm'];

  const handleComplete = useCallback((completed: boolean) => {
    if (done) return;
    setDone(true);
    const now = Date.now();
    setMicroAction({
      completed,
      durationMs: actionStartedAt.current ? now - actionStartedAt.current : 0,
      hesitationMs: actionStartedAt.current
        ? actionStartedAt.current - promptShownAt.current
        : now - promptShownAt.current,
    });
    setTimeout(() => nextStep(), 500);
  }, [done, setMicroAction, nextStep]);

  const handleCompleteRef = useRef(handleComplete);
  handleCompleteRef.current = handleComplete;

  useEffect(() => {
    if (!started || done) return;
    if (secondsLeft <= 0) {
      handleCompleteRef.current(false);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [started, secondsLeft, done]);

  const handleStart = () => {
    actionStartedAt.current = Date.now();
    setStarted(true);
  };

  const progress = 1 - secondsLeft / config.onboarding.microActionDurationSec;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      <h2
        className="text-lg font-light tracking-[0.15em] text-center max-w-xs"
        style={{ color: colors.text.primary }}
      >
        {action}
      </h2>

      {!started ? (
        <motion.button
          onClick={handleStart}
          className="rounded-full cursor-pointer min-h-[44px] min-w-[88px]"
          style={{
            paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
            background: colors.button.warm.bg,
            border: `1px solid ${colors.button.warm.border}`,
            color: colors.accent.warm,
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm tracking-[0.15em] font-light">Begin</span>
        </motion.button>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50" cy="50" r="44"
                fill="none" stroke={colors.card.border} strokeWidth="3"
              />
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none" stroke={colors.accent.warm} strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={276.46}
                initial={{ strokeDashoffset: 276.46 }}
                animate={{ strokeDashoffset: 276.46 * (1 - progress) }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-2xl font-light"
              style={{ color: colors.text.primary }}
            >
              {secondsLeft}
            </span>
          </div>

          {!done && (
            <motion.button
              onClick={() => handleComplete(true)}
              className="rounded-full cursor-pointer min-h-[44px] min-w-[88px]"
              style={{
                paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
                background: colors.button.cool.bg,
                border: `1px solid ${colors.button.cool.border}`,
                color: colors.accent.cool,
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm tracking-[0.15em] font-light">Done</span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
