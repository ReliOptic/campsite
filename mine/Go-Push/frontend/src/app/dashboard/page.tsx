'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { usePlayerStore } from '@/stores/player-store';
import { BossStatus } from '@/components/dashboard/boss-status';
import { QuestCard } from '@/components/dashboard/quest-card';
import { PlayerStats } from '@/components/dashboard/player-stats';
import { CoachMessage } from '@/components/dashboard/coach-message';
import { BossDialogue } from '@/components/dashboard/boss-dialogue';
import { ActionBar } from '@/components/dashboard/action-bar';
import { RecoveryFlow } from '@/components/dashboard/recovery-flow';
import { colors } from '@/config/theme';
import type { CoachId } from '@/data/coach-personas';

const AmbientScene = dynamic(
  () => import('@/components/scenes/ambient-scene').then((m) => m.AmbientScene),
  { ssr: false },
);

const COACH_EMOJIS: Record<CoachId, string> = {
  cat: '🐱',
  bulldozer: '🚜',
  master: '🧘',
  devil: '😈',
};

const COACHES: CoachId[] = ['cat', 'bulldozer', 'master', 'devil'];

export default function Dashboard() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachId>('cat');

  const identityRead = useOnboardingStore((s) => s.identityRead);
  const bossId = usePlayerStore((s) => s.bossId);
  const bossHp = usePlayerStore((s) => s.bossHp);
  const bossMaxHp = usePlayerStore((s) => s.bossMaxHp);
  const questPhase = usePlayerStore((s) => s.questPhase);
  const streak = usePlayerStore((s) => s.streak);
  const shieldActive = usePlayerStore((s) => s.shieldActive);
  const freezeTokens = usePlayerStore((s) => s.freezeTokens);
  const dodgesRemaining = usePlayerStore((s) => s.dodgesRemaining);
  const recoveryMode = usePlayerStore((s) => s.recoveryMode);
  const setQuest = usePlayerStore((s) => s.setQuest);
  const initBoss = usePlayerStore((s) => s.initBoss);
  const dodgeQuest = usePlayerStore((s) => s.dodgeQuest);
  const useFreeze = usePlayerStore((s) => s.useFreeze);
  const completeRecovery = usePlayerStore((s) => s.completeRecovery);

  const previousStreak = useRef(streak);
  useEffect(() => {
    if (!recoveryMode) {
      previousStreak.current = streak;
    }
  }, [recoveryMode, streak]);

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
    usePlayerStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !identityRead) return;

    if (!bossId) {
      initBoss(identityRead.boss.id);
    }

    if (questPhase === 'idle') {
      const quest = identityRead.firstQuest;
      const boss = identityRead.boss;
      const isWeakness = checkWeakness(boss.id, quest);

      setQuest({
        id: quest.id,
        description: quest.description,
        durationSeconds: quest.durationSeconds,
        xpReward: quest.xpReward,
        bossId: boss.id,
        isWeakness,
      });
    }
  }, [hydrated, identityRead, bossId, questPhase, initBoss, setQuest]);

  if (!hydrated) {
    return (
      <div className="h-dvh w-screen" style={{ background: colors.bg.deep }} />
    );
  }

  if (!identityRead) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center" style={{ background: colors.bg.deep }}>
        <button
          onClick={() => router.push('/')}
          className="rounded-full min-h-[44px] min-w-[120px]"
          style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
          style={{
            background: colors.button.warm.bg,
            border: `1px solid ${colors.button.warm.border}`,
            color: colors.accent.warm,
          }}
        >
          <span className="text-sm tracking-[0.15em] font-light">Start Onboarding</span>
        </button>
      </div>
    );
  }

  const isDefeated = bossHp <= 0;

  const bossDialogueCategory = (() => {
    if (bossHp <= 0) return 'defeated';
    if (questPhase === 'active') return 'taunt';
    if (bossMaxHp > 0 && bossHp < bossMaxHp * 0.2) return 'lowHp';
    if (bossMaxHp > 0 && bossHp > bossMaxHp * 0.8) return 'greeting';
    return 'greeting';
  })();

  const coachMessageCategory = (() => {
    if (questPhase === 'ready') return 'questReady';
    if (questPhase === 'complete') return 'questComplete';
    if (questPhase === 'idle' && streak > 0) return 'streak';
    return null;
  })();

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {recoveryMode && (
        <RecoveryFlow
          previousStreak={previousStreak.current}
          onRecover={completeRecovery}
        />
      )}
      <AmbientScene />
      <div className="relative z-10 h-full w-full flex flex-col items-center gap-8 overflow-y-auto" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '2rem', paddingBottom: '2rem' }}>
        {bossId !== null && (
          <BossDialogue bossId={bossId} category={bossDialogueCategory} />
        )}
        <BossStatus />

        {isDefeated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <span
              className="text-lg tracking-[0.15em] font-light"
              style={{ color: colors.accent.warm }}
            >
              Boss Defeated!
            </span>
            <span
              className="text-sm font-light text-center max-w-xs"
              style={{ color: colors.text.primary }}
            >
              You conquered your inner challenge. The journey continues.
            </span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
            {coachMessageCategory !== null && (
              <CoachMessage coachId={selectedCoach} category={coachMessageCategory} />
            )}
            <QuestCard />
            <ActionBar
              shieldActive={shieldActive}
              freezeTokens={freezeTokens}
              dodgesRemaining={dodgesRemaining}
              onDodge={dodgeQuest}
              onFreeze={useFreeze}
            />
          </div>
        )}

        <PlayerStats />

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/puzzle')}
            className="inline-flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] text-xs tracking-[0.1em]"
            style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', color: colors.text.secondary }}
          >
            🧩 퍼즐
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] text-xs tracking-[0.1em]"
            style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', color: colors.text.secondary }}
          >
            📊 프로필
          </button>
        </div>

        <div className="flex items-center gap-3">
          {COACHES.map((coach) => (
            <button
              key={coach}
              onClick={() => setSelectedCoach(coach)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg border transition-colors"
              style={{
                borderColor: selectedCoach === coach ? colors.accent.warm : 'transparent',
              }}
            >
              {COACH_EMOJIS[coach]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function checkWeakness(bossId: string, quest: { description: string }): boolean {
  const desc = quest.description.toLowerCase();
  switch (bossId) {
    case 'fog':
      return desc.includes('일어나') || desc.includes('열') || desc.includes('stand');
    case 'judge':
      return desc.includes('하나') || desc.includes('1') || desc.includes('imperfect');
    case 'drift':
      return desc.includes('집중') || desc.includes('focus') || desc.includes('5분');
    case 'mirror':
      return desc.includes('거울') || desc.includes('나를') || desc.includes('나의') || desc.includes('self');
    case 'clock':
      return desc.includes('바로') || desc.includes('즉시') || desc.includes('immediately');
    default:
      return false;
  }
}
