import { useRef, useState, useCallback } from 'react';
import GIF from 'gif.js';

interface UseGifRecorderOptions {
  width: number;
  height: number;
  quality: number;
  fps: number;
}

type Phase = 'idle' | 'recording' | 'encoding' | 'done';

export function useGifRecorder(
  drawFrame: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, colorBlend: number, tilt: number, grow: number) => void,
  options: UseGifRecorderOptions = { width: 540, height: 540, quality: 10, fps: 10 },
) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [encodingProgress, setEncodingProgress] = useState(0);
  const gifInstanceRef = useRef<GIF | null>(null);

  const record = useCallback(() => {
    if (phase !== 'idle') return;

    // Animation timeline (ms) - must match IsometricCanvas.tsx
    const HOLD_3D = 1500;
    const COLLAPSE = 1500;
    const HOLD_2D = 3000;
    const EXPAND = 1500;
    const TOTAL = HOLD_3D + COLLAPSE + HOLD_2D + EXPAND;

    setPhase('recording');

    const gif = new GIF({
      workers: 2,
      quality: options.quality,
      width: options.width,
      height: options.height,
      workerScript: '/gif.worker.js',
    });

    gifInstanceRef.current = gif;

    gif.on('progress', (p: number) => {
      setEncodingProgress(p);
      setPhase('encoding');
    });

    gif.on('finished', (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-tree.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPhase('done');
      setTimeout(() => setPhase('idle'), 2000);
    });

    // Frame generation
    const frameInterval = 1000 / options.fps;
    const frames: Array<{ tilt: number; grow: number; colorBlend: number; delay: number }> = [];

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Generate frames matching the animation timeline
    for (let elapsed = 0; elapsed < TOTAL; elapsed += frameInterval) {
      let tilt: number, grow: number, colorBlend: number;

      if (elapsed < HOLD_3D) {
        tilt = 1; grow = 1; colorBlend = 1;
      } else if (elapsed < HOLD_3D + COLLAPSE) {
        const p = easeInOutCubic((elapsed - HOLD_3D) / COLLAPSE);
        tilt = 1 - p;
        grow = 1 - p;
        colorBlend = tilt > 0.1 ? 1 : tilt / 0.1;
      } else if (elapsed < HOLD_3D + COLLAPSE + HOLD_2D) {
        tilt = 0; grow = 0; colorBlend = 0;
      } else {
        const p = easeInOutCubic((elapsed - HOLD_3D - COLLAPSE - HOLD_2D) / EXPAND);
        tilt = p;
        grow = p;
        colorBlend = tilt > 0.05 ? 1 : 0;
      }

      // During flat 2D phase, use longer delays for clear QR scanning
      const isFlatPhase = elapsed >= HOLD_3D + COLLAPSE && elapsed < HOLD_3D + COLLAPSE + HOLD_2D;
      const delay = isFlatPhase ? 200 : 100; // 200ms for flat QR (clear), 100ms for 3D

      frames.push({ tilt, grow, colorBlend, delay });
    }

    // Render frames synchronously
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    const ctx = canvas.getContext('2d')!;

    for (const frame of frames) {
      drawFrame(canvas, ctx, frame.colorBlend, frame.tilt, frame.grow);
      gif.addFrame(ctx, { copy: true, delay: frame.delay });
    }

    gif.render();
  }, [phase, drawFrame, options]);

  return { phase, encodingProgress, record };
}
