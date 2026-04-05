'use client';

import { useRef, useEffect } from 'react';
import { Orb } from '@/components/ui/orb';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { colors } from '@/config/theme';
import type { Vibe } from '@/types/onboarding.types';

const VIBES: { id: Vibe; label: string; color: string; glow: string }[] = [
  { id: 'calm', label: 'Calm', color: 'radial-gradient(circle, #44aacc, #1a3a4a)', glow: 'rgba(68,170,204,0.4)' },
  { id: 'heavy', label: 'Heavy', color: 'radial-gradient(circle, #8866aa, #2a1a3a)', glow: 'rgba(136,102,170,0.4)' },
  { id: 'restless', label: 'Restless', color: 'radial-gradient(circle, #cc6644, #3a1a0a)', glow: 'rgba(204,102,68,0.4)' },
  { id: 'drift', label: 'Drift', color: 'radial-gradient(circle, #88aa88, #1a2a1a)', glow: 'rgba(136,170,136,0.4)' },
];

export function VibePicker() {
  const { signals, setVibe, nextStep } = useOnboardingStore();
  const selecting = useRef(false);
  useEffect(() => { selecting.current = false; }, []);

  const handleSelect = (vibe: Vibe) => {
    if (selecting.current) return;
    selecting.current = true;
    setVibe(vibe);
    setTimeout(() => nextStep(), 500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-12" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      <h2
        className="text-lg font-light tracking-[0.15em] text-center"
        style={{ color: colors.text.primary }}
      >
        How do you feel right now?
      </h2>
      <div className="grid grid-cols-2 gap-10">
        {VIBES.map((v) => (
          <Orb
            key={v.id}
            label={v.label}
            color={v.color}
            glowColor={v.glow}
            selected={signals.vibe === v.id}
            onClick={() => handleSelect(v.id)}
          />
        ))}
      </div>
    </div>
  );
}
