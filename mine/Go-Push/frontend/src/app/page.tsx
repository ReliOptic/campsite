'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { sendToUnity, onUnityEvent } from '@/lib/unity-bridge';
import { StepTransition } from '@/components/ui/step-transition';
import { StepDots } from '@/components/ui/step-dots';
import { VibePicker } from '@/components/onboarding/vibe-picker';
import { WeightPicker } from '@/components/onboarding/weight-picker';
import { ScenePicker } from '@/components/onboarding/scene-picker';
import { MicroAction } from '@/components/onboarding/micro-action';
import { Reveal } from '@/components/onboarding/reveal';

const UnityCanvas = dynamic(
  () => import('@/components/scenes/unity-canvas').then((m) => m.UnityCanvas),
  { ssr: false },
);

const STEPS = {
  1: VibePicker,
  2: WeightPicker,
  3: ScenePicker,
  4: MicroAction,
  5: Reveal,
} as const;

export default function Home() {
  const [unityReady, setUnityReady] = useState(false);

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
  }, []);

  // Track Unity LOADED state
  useEffect(() => {
    return onUnityEvent((message) => {
      if (message.type === 'LOADED') {
        setUnityReady(true);
      }
    });
  }, []);

  const step = useOnboardingStore((s) => s.step);
  const StepComponent = STEPS[step];

  // Bridge: sync onboarding state → Unity
  useEffect(() => {
    return useOnboardingStore.subscribe((state, prev) => {
      if (state.signals.vibe !== prev.signals.vibe && state.signals.vibe !== null) {
        sendToUnity('SET_MOOD', { vibe: state.signals.vibe });
      }
      if (state.step !== prev.step) {
        sendToUnity('CHANGE_SCENE', { step: state.step });
      }
      if (state.revealPhase !== prev.revealPhase && state.revealPhase !== null) {
        sendToUnity('SET_PHASE', { phase: state.revealPhase });
        if (
          state.revealPhase === 'boss' &&
          state.identityRead !== null
        ) {
          sendToUnity('SET_BOSS', {
            id: state.identityRead.boss.id,
            hp: state.identityRead.boss.hp,
          });
        }
      }
    });
  }, []);

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      <UnityCanvas />
      {/* Subtle background shimmer while Unity loads — fades on LOADED */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          opacity: unityReady ? 0 : 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(68,170,204,0.06) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <StepTransition stepKey={step}>
          <StepComponent />
        </StepTransition>
      </div>
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
        <StepDots current={step} />
      </div>
    </div>
  );
}
