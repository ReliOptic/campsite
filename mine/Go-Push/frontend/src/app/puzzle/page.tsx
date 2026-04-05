'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { GameOverlay } from '@/components/game-ui/game-overlay';
import { colors } from '@/config/theme';

const GameScene = dynamic(
  () => import('@/components/game/game-scene').then((m) => m.GameScene),
  { ssr: false },
);

export default function PuzzlePage() {
  const router = useRouter();
  const phase = useGameStore((s) => s.phase);
  const moveCount = useGameStore((s) => s.moveCount);

  return (
    <div
      className="relative h-dvh w-screen overflow-hidden"
      style={{ background: colors.bg.deep }}
    >
      {/* 3D game canvas — fills full viewport */}
      <div className="absolute inset-0">
        <GameScene />
      </div>

      {/* Game HUD: move counter, restart, hint, in-game completion modal */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          <GameOverlay />
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="absolute top-4 left-4 z-20 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:opacity-60"
        style={{
          minHeight: '44px',
          minWidth: '44px',
          background: 'rgba(10, 10, 46, 0.75)',
          border: `1px solid ${colors.card.border}`,
          color: colors.text.primary,
          backdropFilter: 'blur(8px)',
        }}
        aria-label="대시보드로 돌아가기"
      >
        <span className="text-base leading-none select-none px-3">←</span>
      </button>

      {/* Page-level completion overlay with dashboard navigation */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(10, 10, 46, 0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="flex flex-col items-center gap-6 rounded-3xl max-w-xs w-full"
              style={{ padding: '2rem', marginLeft: '1rem', marginRight: '1rem' }}
              style={{
                background: colors.card.bg,
                border: `1px solid ${colors.card.border}`,
                backdropFilter: 'blur(12px)',
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.4, type: 'spring', damping: 20 }}
            >
              <span
                className="text-xl tracking-[0.2em] font-light uppercase"
                style={{ color: colors.accent.warm }}
              >
                퍼즐 완료!
              </span>

              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-3xl font-light"
                  style={{ color: colors.accent.warm }}
                >
                  {moveCount}
                </span>
                <span
                  className="text-xs tracking-[0.1em]"
                  style={{ color: colors.text.secondary }}
                >
                  moves
                </span>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl text-sm tracking-[0.12em] font-light transition-opacity hover:opacity-80 active:opacity-60"
                style={{
                  minHeight: '44px',
                  paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
                  background: colors.button.warm.bg,
                  border: `1px solid ${colors.button.warm.border}`,
                  color: colors.accent.warm,
                }}
              >
                대시보드로 돌아가기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
