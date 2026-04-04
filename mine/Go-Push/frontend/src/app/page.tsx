'use client';

import dynamic from 'next/dynamic';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { StepTransition } from '@/components/ui/step-transition';
import { VibePicker } from '@/components/onboarding/vibe-picker';
import { WeightPicker } from '@/components/onboarding/weight-picker';
import { ScenePicker } from '@/components/onboarding/scene-picker';
import { MicroAction } from '@/components/onboarding/micro-action';
import { Reveal } from '@/components/onboarding/reveal';

const AmbientScene = dynamic(
  () => import('@/components/scenes/ambient-scene').then((m) => m.AmbientScene),
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
  const step = useOnboardingStore((s) => s.step);
  const StepComponent = STEPS[step];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <AmbientScene />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <StepTransition stepKey={step}>
          <StepComponent />
        </StepTransition>
      </div>
    </div>
  );
}
