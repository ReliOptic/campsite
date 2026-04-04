'use client';

import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { colors } from '@/config/theme';
import type { Scene } from '@/types/onboarding.types';

const SCENES: { id: Scene; label: string; gradient: string }[] = [
  { id: 'mountain', label: 'Mountain', gradient: 'linear-gradient(135deg, #1a0f3a 0%, #2a1a4a 50%, #0d0d20 100%)' },
  { id: 'ocean', label: 'Ocean', gradient: 'linear-gradient(135deg, #0a1a2e 0%, #0f2a4a 50%, #0a0a2e 100%)' },
  { id: 'forest', label: 'Forest', gradient: 'linear-gradient(135deg, #0a1a0f 0%, #1a2a1a 50%, #0d200d 100%)' },
  { id: 'city', label: 'City', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a3a 50%, #0f0f20 100%)' },
  { id: 'space', label: 'Space', gradient: 'linear-gradient(135deg, #0a0a1e 0%, #0f0f2a 50%, #050510 100%)' },
];

export function ScenePicker() {
  const { signals, setScene, nextStep } = useOnboardingStore();

  const handleSelect = (scene: Scene) => {
    setScene(scene);
    setTimeout(() => nextStep(), 600);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-6">
      <h2
        className="text-lg font-light tracking-[0.15em] text-center"
        style={{ color: colors.text.primary }}
      >
        Which world feels like today?
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {SCENES.map((s, i) => (
          <motion.button
            key={s.id}
            onClick={() => handleSelect(s.id)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className={`relative rounded-2xl overflow-hidden cursor-pointer ${
              s.id === 'space' ? 'col-span-2' : ''
            }`}
            style={{
              background: s.gradient,
              height: s.id === 'space' ? 80 : 120,
              border:
                signals.scene === s.id
                  ? `2px solid ${colors.card_active.border}`
                  : `1px solid ${colors.card.border}`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span
              className="absolute bottom-3 left-4 text-xs tracking-[0.15em] font-light"
              style={{ color: signals.scene === s.id ? colors.accent.warm : colors.text.primary }}
            >
              {s.label}
            </span>
            {signals.scene === s.id && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: `radial-gradient(circle at center, ${colors.card_active.bg}, transparent 70%)`,
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
