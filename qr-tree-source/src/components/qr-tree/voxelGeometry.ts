import type { QRMatrix } from './useQRMatrix';
import type { TreeTheme } from './themes';
import { THEMES } from './themes';

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
  type: 'qr-dark' | 'qr-light' | 'trunk' | 'foliage' | 'finder';
}

function getFinderRegions(size: number) {
  return [
    { r: 0, c: 0 },
    { r: 0, c: size - 7 },
    { r: size - 7, c: 0 },
  ];
}

function isInFinderPattern(row: number, col: number, size: number): boolean {
  for (const { r, c } of getFinderRegions(size)) {
    if (row >= r && row < r + 7 && col >= c && col < c + 7) return true;
  }
  return false;
}

function isTreeZone(row: number, col: number, size: number): boolean {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.22;
  return Math.sqrt((col - cx) ** 2 + (row - cy) ** 2) <= radius;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateVoxels(matrix: QRMatrix, theme?: TreeTheme): Voxel[] {
  const t = theme || THEMES[0];
  const { modules, size } = matrix;
  const voxels: Voxel[] = [];

  let seed = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (modules[r][c]) seed = (seed * 31 + r * size + c) | 0;
  const rand = seededRandom(Math.abs(seed) || 42);

  // QR base (z=0)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const dark = modules[r][c];
      const finder = isInFinderPattern(r, c, size);
      voxels.push({
        x: c, y: r, z: 0,
        color: finder
          ? (dark ? t.finder : t.qrLight)
          : (dark ? t.qrDark : t.qrLight),
        type: finder ? 'finder' : (dark ? 'qr-dark' : 'qr-light'),
      });
    }
  }

  // Trunk
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const trunkPositions: Array<{ r: number; c: number }> = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!modules[r][c] || !isTreeZone(r, c, size) || isInFinderPattern(r, c, size)) continue;
      const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
      if (dist < size * 0.08 || rand() < 0.3) trunkPositions.push({ r, c });
    }
  }

  const maxTrunk = Math.max(4, Math.floor(size * 0.3));

  for (const pos of trunkPositions) {
    const dist = Math.sqrt((pos.c - cx) ** 2 + (pos.r - cy) ** 2);
    const hf = 1 - dist / (size * 0.25);
    const h = Math.max(2, Math.floor(maxTrunk * hf * (0.7 + rand() * 0.3)));
    for (let z = 1; z <= h; z++) {
      voxels.push({
        x: pos.c, y: pos.r, z,
        color: t.trunk[Math.floor(rand() * t.trunk.length)],
        type: 'trunk',
      });
    }
  }

  // Canopy
  const canopyBase = Math.floor(maxTrunk * 0.5);
  const canopyTop = maxTrunk + Math.floor(size * 0.25);
  const canopyRadius = size * 0.28;

  for (let z = canopyBase; z <= canopyTop; z++) {
    const zt = (z - canopyBase) / (canopyTop - canopyBase);

    let layerRadius: number;
    if (t.canopyShape === 'cone') {
      layerRadius = canopyRadius * (1 - zt) * (0.8 + rand() * 0.3);
    } else if (t.canopyShape === 'spread') {
      layerRadius = canopyRadius * (zt < 0.3 ? zt / 0.3 : 1.1 - zt * 0.3) * (0.8 + rand() * 0.3);
    } else {
      layerRadius = canopyRadius * Math.sin(zt * Math.PI) * (0.8 + rand() * 0.4);
    }

    for (let r = -Math.ceil(canopyRadius); r <= Math.ceil(canopyRadius); r++) {
      for (let c = -Math.ceil(canopyRadius); c <= Math.ceil(canopyRadius); c++) {
        const dist = Math.sqrt(r * r + c * c);
        if (dist > layerRadius) continue;
        const edge = 1 - dist / layerRadius;
        if (rand() > edge * t.canopyDensity + 0.1) continue;
        const bx = cx + c;
        const by = cy + r;
        if (bx < 0 || bx >= size || by < 0 || by >= size) continue;
        voxels.push({
          x: bx, y: by, z,
          color: t.foliage[Math.floor(rand() * t.foliage.length)],
          type: 'foliage',
        });
      }
    }
  }

  return voxels;
}
