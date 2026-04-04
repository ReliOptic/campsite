'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { config } from '@/config';
import { colors } from '@/config/theme';
import type { IdentityRead } from '@/types/identity.types';
import { BOSS_ARCHETYPES } from '@/types/boss.types';
import type { BossVisual } from '@/types/boss.types';

const BOSS_EMOJI: Record<BossVisual, string> = {
  misty: '🌫️',
  stone: '🗿',
  flowing: '🌊',
  reflective: '🪞',
  ticking: '⏰',
};

async function fetchIdentity(
  signals: Record<string, unknown>,
): Promise<IdentityRead> {
  const res = await fetch(`${config.api.baseUrl}/api/identity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signals }),
  });

  if (!res.ok) {
    throw new Error(`Identity API failed: ${res.status}`);
  }

  return res.json();
}

function generateFallbackIdentity(
  vibe: string,
  weight: string,
): IdentityRead {
  const bossMap: Record<string, keyof typeof BOSS_ARCHETYPES> = {
    'calm-work': 'drift',
    'calm-health': 'fog',
    'calm-relationships': 'mirror',
    'calm-identity': 'mirror',
    'calm-time': 'clock',
    'heavy-work': 'judge',
    'heavy-health': 'fog',
    'heavy-relationships': 'mirror',
    'heavy-identity': 'judge',
    'heavy-time': 'clock',
    'restless-work': 'clock',
    'restless-health': 'drift',
    'restless-relationships': 'drift',
    'restless-identity': 'fog',
    'restless-time': 'clock',
    'drift-work': 'drift',
    'drift-health': 'fog',
    'drift-relationships': 'mirror',
    'drift-identity': 'fog',
    'drift-time': 'drift',
  };

  const key = `${vibe}-${weight}`;
  const bossId = bossMap[key] ?? 'fog';
  const archetype = BOSS_ARCHETYPES[bossId];

  return {
    narrative: `You carry a quiet weight. Something stirs beneath the surface, waiting. Today, you chose to notice it. That's already more than most people do.`,
    boss: { ...archetype, hp: archetype.maxHp },
    firstQuest: {
      id: `quest-${Date.now()}`,
      description: '지금 있는 자리에서 일어나서 창문을 열어봐',
      durationSeconds: 60,
      xpReward: 50,
      bossId,
    },
    memoryShard: {
      compressedTokens: 0,
      rawTokens: 0,
      compressionRatio: 0,
      promptCacheHit: false,
    },
  };
}

export function Reveal() {
  const { signals, identityRead, setIdentityRead, isLoading, setLoading } =
    useOnboardingStore();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    setLoading(true);

    const load = async () => {
      try {
        const result = await fetchIdentity(signals as unknown as Record<string, unknown>);
        setIdentityRead(result);
      } catch {
        const fallback = generateFallbackIdentity(
          signals.vibe ?? 'calm',
          signals.weight ?? 'work',
        );
        setIdentityRead(fallback);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading || !identityRead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          className="w-16 h-16 rounded-full"
          style={{ background: colors.glow.loading }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span
          className="text-sm tracking-[0.15em] font-light"
          style={{ color: colors.text.secondary }}
        >
          Reading you...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6 max-w-sm mx-auto">
      <motion.p
        className="text-base font-light leading-relaxed text-center"
        style={{ color: colors.text.primary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        {identityRead.narrative}
      </motion.p>

      <motion.div
        className="flex flex-col items-center gap-3 mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: colors.glow.bossOrb,
            boxShadow: `0 0 30px ${colors.glow.warm}`,
          }}
        >
          <span className="text-2xl">
            {BOSS_EMOJI[identityRead.boss.visual]}
          </span>
        </div>
        <span
          className="text-sm tracking-[0.2em] font-light"
          style={{ color: colors.accent.warm }}
        >
          {identityRead.boss.name}
        </span>
        <span
          className="text-xs font-light text-center"
          style={{ color: colors.text.secondary }}
        >
          {identityRead.boss.description}
        </span>
      </motion.div>

      <motion.div
        className="mt-6 px-5 py-4 rounded-2xl w-full"
        style={{
          background: colors.card.bg,
          border: `1px solid ${colors.card.border}`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.6 }}
      >
        <span
          className="text-xs tracking-[0.12em] uppercase block mb-2"
          style={{ color: colors.accent.cool }}
        >
          First Quest
        </span>
        <span
          className="text-sm font-light block"
          style={{ color: colors.text.primary }}
        >
          {identityRead.firstQuest.description}
        </span>
      </motion.div>
    </div>
  );
}
