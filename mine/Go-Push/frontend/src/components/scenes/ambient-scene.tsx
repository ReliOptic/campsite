'use client';

import { useRef, useMemo, Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { colors } from '@/config/theme';

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AmbientScene] WebGL/R3F error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 -z-10"
          style={{ background: colors.bg.deep }}
        />
      );
    }
    return this.props.children;
  }
}

const VIBE_COLORS = {
  calm: { base: '#0a1a2e', accent: '#44aacc', fog: '#0f2a4a' },
  heavy: { base: '#1a0f3a', accent: '#8866aa', fog: '#2a1a4a' },
  restless: { base: '#1a0a0a', accent: '#cc6644', fog: '#3a1a0a' },
  drift: { base: '#0a1a0f', accent: '#88aa88', fog: '#1a2a1a' },
} as const;

function FloatingParticles({ color, count = 60 }: { color: string; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
      ] as [number, number, number],
      speed: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      scale: 0.01 + Math.random() * 0.03,
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(t * p.speed + p.offset) * 0.5,
        p.position[1] + Math.sin(t * p.speed * 0.7 + p.offset) * 0.3,
        p.position[2],
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={colorObj} transparent opacity={0.6} />
    </instancedMesh>
  );
}

function SceneContent() {
  const vibe = useOnboardingStore((s) => s.signals.vibe);
  const colors = VIBE_COLORS[vibe ?? 'calm'];

  return (
    <>
      <color attach="background" args={[colors.base]} />
      <fog attach="fog" args={[colors.fog, 5, 15]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, 2]} intensity={0.5} color={colors.accent} />
      <Stars
        radius={50}
        depth={40}
        count={1500}
        factor={3}
        saturation={0.1}
        fade
        speed={0.5}
      />
      <FloatingParticles color={colors.accent} />
    </>
  );
}

export function AmbientScene() {
  return (
    <CanvasErrorBoundary>
      <div className="fixed inset-0 -z-10">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
