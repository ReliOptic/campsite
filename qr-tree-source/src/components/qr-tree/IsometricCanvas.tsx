import { useRef, useEffect } from 'react';
import type { Voxel } from './voxelGeometry';
import { renderScan, renderAnimated } from './renderVoxels';

interface Props {
  voxels: Voxel[];
  qrSize: number;
  mode: 'preview' | 'scan';
  width: number;
  height: number;
}

const HOLD_3D = 1500;
const COLLAPSE = 1500;
const HOLD_2D = 3000;
const EXPAND = 1500;
const TOTAL = HOLD_3D + COLLAPSE + HOLD_2D + EXPAND;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function IsometricCanvas({ voxels, qrSize, mode, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const sortedRef = useRef<Voxel[]>([]);
  const voxelsIdRef = useRef<Voxel[]>();
  if (voxelsIdRef.current !== voxels) {
    voxelsIdRef.current = voxels;
    sortedRef.current = [...voxels].sort((a, b) => {
      const da = a.x + a.y, db = b.x + b.y;
      return da !== db ? da - db : a.z - b.z;
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cancelAnimationFrame(rafRef.current);

    if (mode === 'scan') {
      renderScan(ctx, voxels, qrSize, width, height, '#FAFAFA');
      return;
    }

    startRef.current = performance.now();

    function frame(now: number) {
      const elapsed = (now - startRef.current) % TOTAL;

      let tilt: number;
      let grow: number;
      let colorBlend: number;

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

      renderAnimated(
        ctx, sortedRef.current, qrSize, width, height,
        colorBlend, tilt, grow,
        '#FAFAFA',
      );

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [voxels, qrSize, mode, width, height]);

  return <canvas ref={canvasRef} />;
}
