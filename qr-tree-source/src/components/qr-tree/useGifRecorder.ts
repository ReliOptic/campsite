import { useRef, useCallback, useState } from 'react';
import GIF from 'gif.js';

export type RecordingPhase = 'idle' | 'flat' | 'transition' | 'hold' | 'encoding';

interface RecorderOptions {
  width: number;
  height: number;
  flatSeconds: number;       // standard QR hold
  transitionSeconds: number; // rotate + color + grow
  holdSeconds: number;       // 3D hold
  fps: number;
}

const DEFAULTS: RecorderOptions = {
  width: 540,
  height: 540,
  flatSeconds: 5,
  transitionSeconds: 3,
  holdSeconds: 2,
  fps: 15,
};

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useGifRecorder(
  drawFrame: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    colorBlend: number,
    tilt: number,
    grow: number,
  ) => void,
  opts?: Partial<RecorderOptions>,
) {
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [encodingProgress, setEncodingProgress] = useState(0);
  const abortRef = useRef(false);

  const record = useCallback(async () => {
    const o = { ...DEFAULTS, ...opts };
    abortRef.current = false;

    const canvas = document.createElement('canvas');
    canvas.width = o.width;
    canvas.height = o.height;
    const ctx = canvas.getContext('2d')!;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: o.width,
      height: o.height,
      repeat: 0,
      workerScript: `${import.meta.env.BASE_URL}gif.worker.js`,
    });

    const delay = Math.round(1000 / o.fps);

    // Phase 1: standard black/white QR (single long-delay frame)
    setPhase('flat');
    drawFrame(canvas, ctx, 0, 0, 0);
    gif.addFrame(ctx, { copy: true, delay: Math.round(o.flatSeconds * 1000) });

    // Phase 2: rotate + color shift + tree grow
    setPhase('transition');
    const transFrames = Math.round(o.transitionSeconds * o.fps);
    for (let i = 0; i <= transFrames; i++) {
      if (abortRef.current) return;
      const p = i / transFrames;
      const tilt = easeInOutCubic(p);
      const grow = easeOutCubic(p);
      const colorBlend = Math.min(p / 0.4, 1);
      drawFrame(canvas, ctx, colorBlend, tilt, grow);
      gif.addFrame(ctx, { copy: true, delay });
    }

    // Phase 3: hold full 3D (single long-delay frame)
    setPhase('hold');
    drawFrame(canvas, ctx, 1, 1, 1);
    gif.addFrame(ctx, { copy: true, delay: Math.round(o.holdSeconds * 1000) });

    // Encode
    setPhase('encoding');
    return new Promise<void>((resolve) => {
      gif.on('progress', (p: number) => setEncodingProgress(p));
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qr-tree.gif';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setPhase('idle');
        setEncodingProgress(0);
        resolve();
      });
      gif.render();
    });
  }, [drawFrame, opts]);

  const abort = useCallback(() => {
    abortRef.current = true;
    setPhase('idle');
  }, []);

  return { phase, encodingProgress, record, abort };
}
