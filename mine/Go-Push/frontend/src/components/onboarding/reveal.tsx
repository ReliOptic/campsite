'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { getFallbackNarrative } from '@/data/fallback-narratives';
import { BOSS_ARCHETYPES } from '@/types/boss.types';
import { colors } from '@/config/theme';
import type { FallbackNarrative } from '@/data/fallback-narratives';

type RevealPhase = 'loading' | 'narrative' | 'boss' | 'quest' | 'complete';

export function Reveal() {
  const router = useRouter();
  const { signals, nextStep, setIdentityRead } = useOnboardingStore();
  const [phase, setPhase] = useState<RevealPhase>('loading');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const narrativeRef = useRef<FallbackNarrative | null>(null);

  useEffect(() => {
    const vibe = signals.vibe ?? 'calm';
    const weight = signals.weight ?? 'work';
    narrativeRef.current = getFallbackNarrative(vibe, weight);

    const loadTimer = setTimeout(() => {
      setPhase('narrative');
    }, 2000);

    return () => clearTimeout(loadTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'narrative' || !narrativeRef.current) return;

    const text = narrativeRef.current.narrative;
    let index = 0;
    let postTypingTimer: ReturnType<typeof setTimeout> | null = null;
    setIsTyping(true);

    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
        postTypingTimer = setTimeout(() => setPhase('boss'), 1200);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      if (postTypingTimer) clearTimeout(postTypingTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'boss' || !narrativeRef.current) return;

    const timer = setTimeout(() => setPhase('quest'), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'quest' || !narrativeRef.current) return;

    const fallback = narrativeRef.current;
    const bossData = BOSS_ARCHETYPES[fallback.bossId];

    setIdentityRead({
      narrative: fallback.narrative,
      boss: { ...bossData, hp: bossData.maxHp },
      firstQuest: {
        id: `quest-${fallback.bossId}-001`,
        description: fallback.questDescription,
        durationSeconds: fallback.questDurationSeconds,
        xpReward: 50,
        bossId: fallback.bossId,
      },
      memoryShard: {
        compressedTokens: 0,
        rawTokens: 0,
        compressionRatio: 0,
        promptCacheHit: false,
      },
    });
  }, [phase, setIdentityRead]);

  const handleStartJourney = useCallback(() => {
    nextStep();
    router.push('/dashboard');
  }, [router, nextStep]);

  const fallback = narrativeRef.current;
  const boss = fallback ? BOSS_ARCHETYPES[fallback.bossId] : null;

  return (
    <div className="flex flex-col items-center justify-center h-full relative" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <motion.div
            key="loading"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full"
              style={{ background: colors.glow.loading }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span
              className="text-xs tracking-[0.2em] font-light"
              style={{ color: colors.text.secondary }}
            >
              Reading your signals...
            </span>
          </motion.div>
        )}

        {phase === 'narrative' && (
          <motion.div
            key="narrative"
            className="flex flex-col items-center gap-8 max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-base font-light leading-relaxed tracking-wide text-center"
              style={{ color: colors.text.primary }}
            >
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{ color: colors.accent.warm }}
                >
                  |
                </motion.span>
              )}
            </p>
          </motion.div>
        )}

        {phase === 'boss' && boss && (
          <motion.div
            key="boss"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              className="w-24 h-24 rounded-full relative"
              style={{
                background: colors.glow.bossOrb,
                boxShadow: `0 0 60px 20px ${colors.glow.warm}`,
              }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-sm tracking-[0.2em] font-light uppercase"
                style={{ color: colors.accent.warm }}
              >
                Your inner challenge
              </span>
              <span
                className="text-2xl tracking-[0.15em] font-light"
                style={{ color: colors.text.primary }}
              >
                {boss.name}
              </span>
              <span
                className="text-xs tracking-[0.12em] font-light text-center max-w-xs"
                style={{ color: colors.text.secondary }}
              >
                {boss.description}
              </span>
            </div>
          </motion.div>
        )}

        {phase === 'quest' && fallback && boss && (
          <motion.div
            key="quest"
            className="flex flex-col items-center gap-8 max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-xs tracking-[0.2em] font-light uppercase"
                style={{ color: colors.text.secondary }}
              >
                {boss.name} · HP {boss.maxHp}
              </span>
              <div
                className="w-48 h-1 rounded-full overflow-hidden"
                style={{ background: colors.card.border }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: '100%', background: colors.accent.warm }}
                />
              </div>
            </div>

            <div
              className="rounded-2xl w-full"
              style={{ padding: '1.5rem' }}
              style={{
                background: colors.card.bg,
                border: `1px solid ${colors.card.border}`,
              }}
            >
              <span
                className="text-xs tracking-[0.15em] font-light uppercase block mb-3"
                style={{ color: colors.accent.cool }}
              >
                First Quest
              </span>
              <p
                className="text-sm font-light leading-relaxed"
                style={{ color: colors.text.primary }}
              >
                {fallback.questDescription}
              </p>
              <span
                className="text-xs font-light mt-3 block"
                style={{ color: colors.text.secondary }}
              >
                {fallback.questDurationSeconds}s · 50 XP
              </span>
            </div>

            <motion.button
              onClick={handleStartJourney}
              className="rounded-full cursor-pointer min-h-[44px] min-w-[120px]"
              style={{
                paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
                background: colors.button.warm.bg,
                border: `1px solid ${colors.button.warm.border}`,
                color: colors.accent.warm,
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm tracking-[0.15em] font-light">Start Journey</span>
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>

      <span
        className="absolute bottom-4 right-4 text-[8px] font-light"
        style={{ color: colors.text.secondary }}
      >
        [offline]
      </span>
    </div>
  );
}
