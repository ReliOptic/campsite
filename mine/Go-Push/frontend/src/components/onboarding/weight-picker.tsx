'use client';

import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { colors } from '@/config/theme';
import type { Weight } from '@/types/onboarding.types';

const WEIGHTS: { id: Weight; label: string; icon: string }[] = [
  { id: 'work', label: 'Work', icon: '⚡' },
  { id: 'health', label: 'Health', icon: '🌿' },
  { id: 'relationships', label: 'People', icon: '🌙' },
  { id: 'identity', label: 'Identity', icon: '🪞' },
  { id: 'time', label: 'Time', icon: '⏳' },
];

export function WeightPicker() {
  const { signals, setWeight, nextStep } = useOnboardingStore();

  const handleSelect = (weight: Weight) => {
    setWeight(weight);
    setTimeout(() => nextStep(), 500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-6">
      <h2
        className="text-lg font-light tracking-[0.15em] text-center"
        style={{ color: colors.text.primary }}
      >
        What feels heaviest right now?
      </h2>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {WEIGHTS.map((w, i) => (
          <motion.button
            key={w.id}
            onClick={() => handleSelect(w.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer"
            style={{
              background:
                signals.weight === w.id
                  ? colors.card_active.bg
                  : colors.card.bg,
              border:
                signals.weight === w.id
                  ? `1px solid ${colors.card_active.border}`
                  : `1px solid ${colors.card.border}`,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-xl">{w.icon}</span>
            <span
              className="text-sm tracking-[0.12em] font-light"
              style={{ color: signals.weight === w.id ? colors.accent.warm : colors.text.primary }}
            >
              {w.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
