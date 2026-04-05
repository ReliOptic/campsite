'use client';

import { useRef, useState, useEffect, type CSSProperties } from 'react';
import { colors } from '@/config/theme';
import {
  setUnityInstance,
  onUnityEvent,
  onProgress,
} from '@/lib/unity-bridge';
import type { UnityInstance } from '@/types/unity-bridge.types';

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: UnityBuildConfig,
      onProgress?: (progress: number) => void,
    ) => Promise<UnityInstance>;
  }
}

interface UnityBuildConfig {
  readonly dataUrl: string;
  readonly frameworkUrl: string;
  readonly codeUrl: string;
}

const BUILD_ROOT = '/unity-build/Build';

const UNITY_CONFIG: UnityBuildConfig = {
  dataUrl: `${BUILD_ROOT}/unity-build.data`,
  frameworkUrl: `${BUILD_ROOT}/unity-build.framework.js`,
  codeUrl: `${BUILD_ROOT}/unity-build.wasm`,
} as const;

export function UnityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    let scriptEl: HTMLScriptElement | null = null;

    // WebGL context loss handling
    const handleContextLost = (event: Event): void => {
      event.preventDefault();
      setHasError(true);
      console.warn('[UnityCanvas] WebGL context lost');
    };

    const handleContextRestored = (): void => {
      setHasError(false);
      console.warn('[UnityCanvas] WebGL context restored');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Subscribe to LOADED event
    const unsubscribeLoaded = onUnityEvent((message) => {
      if (message.type === 'LOADED') {
        setIsLoaded(true);
      }
    });

    // Subscribe to progress events from bridge
    const unsubscribeProgress = onProgress((progress) => {
      setLoadProgress(progress);
    });

    // Dynamically load the Unity loader script
    scriptEl = document.createElement('script');
    scriptEl.src = `${BUILD_ROOT}/unity-build.loader.js`;

    scriptEl.onload = (): void => {
      if (typeof window.createUnityInstance !== 'function') {
        console.error('[UnityCanvas] createUnityInstance not available after loader script load');
        setHasError(true);
        return;
      }

      window
        .createUnityInstance(
          canvas,
          UNITY_CONFIG,
          (progress: number) => {
            setLoadProgress(progress);
          },
        )
        .then((instance: UnityInstance) => {
          setUnityInstance(instance);
        })
        .catch((err: unknown) => {
          console.error('[UnityCanvas] createUnityInstance failed:', err);
          setHasError(true);
        });
    };

    scriptEl.onerror = (): void => {
      console.error('[UnityCanvas] Failed to load Unity loader script');
      setHasError(true);
    };

    document.body.appendChild(scriptEl);

    return (): void => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      unsubscribeLoaded();
      unsubscribeProgress();
      // Do NOT call dispose() or Quit() — instance is module-level singleton
      // shared across route navigations to avoid reloading the ~10MB WebGL build
    };
  }, []);

  const fallbackStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -10,
    background: colors.bg.deep,
    pointerEvents: 'none',
  };

  if (hasError) {
    return <div style={fallbackStyle} aria-hidden="true" />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -10, pointerEvents: 'none' }}>
      {/* Loading bar — visible until Unity sends LOADED */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: colors.bg.deep,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '2rem',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              width: '200px',
              height: '2px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '1px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${loadProgress * 100}%`,
                background: colors.accent.cool,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
}
