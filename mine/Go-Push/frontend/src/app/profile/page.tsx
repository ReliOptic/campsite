'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { usePlayerStore } from '@/stores/player-store';
import { colors } from '@/config/theme';
import { TimingInsights } from '@/components/profile/timing-insights';
import { StreakStats } from '@/components/profile/streak-stats';

const BehaviorRadar = dynamic(
  () => import('@/components/profile/behavior-radar').then((m) => m.BehaviorRadar),
  { ssr: false },
);

export default function ProfilePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const { signals, identityRead } = useOnboardingStore();
  const { xp, streak, bossId, bossHp, bossMaxHp } = usePlayerStore();

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
    usePlayerStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !identityRead) {
      router.replace('/');
    }
  }, [hydrated, identityRead, router]);

  if (!hydrated) {
    return <div className="h-dvh" style={{ background: colors.bg.deep }} />;
  }

  if (!identityRead) {
    return null;
  }

  return (
    <div
      className="h-dvh overflow-y-auto"
      style={{ background: colors.bg.deep }}
    >
      <div className="flex flex-col gap-8" style={{ maxWidth: '384px', margin: '0 auto', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '2rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <motion.div
          className="flex flex-col gap-1"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-light"
            style={{ color: colors.text.secondary }}
          >
            심리 프로파일
          </span>
          <h1
            className="text-xl font-light tracking-wide"
            style={{ color: colors.text.primary }}
          >
            행동 패턴 분석
          </h1>
        </motion.div>

        {/* Behavior Radar */}
        <motion.section
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span
            className="text-[10px] tracking-[0.15em] uppercase font-light"
            style={{ color: colors.text.secondary }}
          >
            행동 차원
          </span>
          <div
            className="rounded-2xl flex items-center justify-center"
              style={{ padding: '1rem' }}
            style={{
              background: colors.card.bg,
              border: `1px solid ${colors.card.border}`,
            }}
          >
            <BehaviorRadar signals={signals} microAction={signals.microAction} />
          </div>
        </motion.section>

        {/* Timing Insights */}
        {signals.timingMeta && (
          <motion.section
            className="flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span
              className="text-[10px] tracking-[0.15em] uppercase font-light"
              style={{ color: colors.text.secondary }}
            >
              타이밍 분석
            </span>
            <div
              className="rounded-2xl"
              style={{ padding: '1rem' }}
              style={{
                background: colors.card.bg,
                border: `1px solid ${colors.card.border}`,
              }}
            >
              <TimingInsights timingMeta={signals.timingMeta} />
            </div>
          </motion.section>
        )}

        {/* Streak & Boss Stats */}
        <motion.section
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span
            className="text-[10px] tracking-[0.15em] uppercase font-light"
            style={{ color: colors.text.secondary }}
          >
            진행 현황
          </span>
          <StreakStats
            xp={xp}
            streak={streak}
            bossId={bossId}
            bossHp={bossHp}
            bossMaxHp={bossMaxHp}
          />
        </motion.section>

        {/* Back to dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-full cursor-pointer min-h-[44px]"
            style={{
              paddingTop: '0.75rem', paddingBottom: '0.75rem',
              background: colors.button.warm.bg,
              border: `1px solid ${colors.button.warm.border}`,
              color: colors.accent.warm,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-sm tracking-[0.15em] font-light">
              대시보드로 돌아가기
            </span>
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
