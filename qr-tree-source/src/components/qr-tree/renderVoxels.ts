import type { Voxel } from './voxelGeometry';

const COS_ISO = Math.cos(Math.PI / 6);
const SIN_ISO = Math.sin(Math.PI / 6);

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function project(
  x: number, y: number, z: number,
  s: number, ox: number, oy: number,
  tilt: number,
  qrSize: number,
) {
  const cx = x - qrSize / 2;
  const cy = y - qrSize / 2;
  const flatSx = cx * s + ox;
  const flatSy = cy * s + oy;
  const isoSx = (cx - cy) * COS_ISO * s + ox;
  const isoSy = (cx + cy) * SIN_ISO * s - z * s + oy;

  const smoothTilt = tilt * tilt * (3 - 2 * tilt);
  return {
    sx: lerp(flatSx, isoSx, smoothTilt),
    sy: lerp(flatSy, isoSy, smoothTilt),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgb(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function lerpColor(hex: string, target: [number, number, number], t: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgb(lerp(r, target[0], t), lerp(g, target[1], t), lerp(b, target[2], t));
}

function adj(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

const QR_BLACK: [number, number, number] = [30, 30, 30];
const QR_WHITE: [number, number, number] = [250, 250, 250];

function qrTargetColor(v: Voxel): [number, number, number] {
  if (v.type === 'qr-light' || v.type === 'trunk' || v.type === 'foliage') return QR_WHITE;
  if (v.type === 'finder') {
    const [r, g, b] = hexToRgb(v.color);
    return (r + g + b) > 600 ? QR_WHITE : QR_BLACK;
  }
  return QR_BLACK;
}

export function renderScan(
  ctx: CanvasRenderingContext2D,
  voxels: Voxel[],
  qrSize: number,
  w: number, h: number,
  bg = '#FFFFFF',
) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const pad = 24;
  const avail = Math.min(w, h) - pad * 2;
  const s = avail / qrSize;
  const ox = (w - qrSize * s) / 2;
  const oy = (h - qrSize * s) / 2;

  ctx.fillStyle = '#FFFFFF';
  const qz = s * 4;
  ctx.fillRect(ox - qz, oy - qz, qrSize * s + qz * 2, qrSize * s + qz * 2);

  for (const v of voxels) {
    if (v.z !== 0) continue;
    const [r, g, b] = qrTargetColor(v);
    ctx.fillStyle = rgb(r, g, b);
    ctx.fillRect(v.x * s + ox, v.y * s + oy, Math.ceil(s), Math.ceil(s));
  }
}

export function renderAnimated(
  ctx: CanvasRenderingContext2D,
  sortedVoxels: Voxel[],
  qrSize: number,
  w: number, h: number,
  colorBlend: number,
  tilt: number,
  grow: number,
  bg = '#FAFAFA',
) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  let maxZ = 0;
  for (const v of sortedVoxels) if (v.z > maxZ) maxZ = v.z;
  const visibleZ = maxZ * grow;

  const extent = qrSize * 1.5;
  const avail = Math.min(w, h) * 0.75;
  const s = avail / extent;
  const ox = w / 2;
  const oy = h / 2;

  if (tilt < 0.01) {
    for (const v of sortedVoxels) {
      if (v.z > visibleZ) continue;
      const target = qrTargetColor(v);
      const blendedColor = colorBlend <= 0
        ? rgb(target[0], target[1], target[2])
        : lerpColor(v.color, target, 1 - colorBlend);
      const flatSx = (v.x - qrSize / 2) * s + ox;
      const flatSy = (v.y - qrSize / 2) * s + oy;
      ctx.fillStyle = blendedColor;
      ctx.fillRect(Math.round(flatSx), Math.round(flatSy), Math.ceil(s + 0.5), Math.ceil(s + 0.5));
    }
    return;
  }

  for (const v of sortedVoxels) {
    if (v.z > visibleZ) continue;
    drawVoxel(ctx, v, s, ox, oy, tilt, colorBlend, qrSize);
  }
}

function drawVoxel(
  ctx: CanvasRenderingContext2D,
  v: Voxel, s: number, ox: number, oy: number,
  tilt: number, colorBlend: number, qrSize: number,
) {
  const { x, y, z, color } = v;

  const target = qrTargetColor(v);
  const blendedColor = colorBlend >= 1
    ? color
    : colorBlend <= 0
      ? rgb(target[0], target[1], target[2])
      : lerpColor(color, target, 1 - colorBlend);

  if (tilt < 0.25) {
    const t = tilt / 0.25;

    const flatSx = (x - qrSize / 2) * s + ox;
    const flatSy = (y - qrSize / 2) * s + oy;
    ctx.globalAlpha = 1 - t * t;
    ctx.fillStyle = blendedColor;
    ctx.fillRect(Math.round(flatSx), Math.round(flatSy), Math.ceil(s + 0.5), Math.ceil(s + 0.5));
    ctx.globalAlpha = 1;

    const p = (px: number, py: number, pz: number) => project(px, py, pz, s, ox, oy, tilt, qrSize);
    const tl = p(x, y, z + 1);
    const tr = p(x + 1, y, z + 1);
    const fr = p(x + 1, y + 1, z + 1);
    const bl = p(x, y + 1, z + 1);

    ctx.globalAlpha = t * t;
    ctx.fillStyle = adj(blendedColor, 1.05);
    ctx.beginPath();
    ctx.moveTo(tl.sx, tl.sy);
    ctx.lineTo(tr.sx, tr.sy);
    ctx.lineTo(fr.sx, fr.sy);
    ctx.lineTo(bl.sx, bl.sy);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    if (t > 0.4) {
      const sideT = (t - 0.4) / 0.6;
      const br = p(x + 1, y, z);
      const bf = p(x + 1, y + 1, z);
      const bb = p(x, y + 1, z);

      ctx.globalAlpha = sideT * sideT;
      ctx.fillStyle = adj(blendedColor, 0.85);
      ctx.beginPath();
      ctx.moveTo(tr.sx, tr.sy);
      ctx.lineTo(fr.sx, fr.sy);
      ctx.lineTo(bf.sx, bf.sy);
      ctx.lineTo(br.sx, br.sy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = adj(blendedColor, 0.6);
      ctx.beginPath();
      ctx.moveTo(bl.sx, bl.sy);
      ctx.lineTo(fr.sx, fr.sy);
      ctx.lineTo(bf.sx, bf.sy);
      ctx.lineTo(bb.sx, bb.sy);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    return;
  }

  const p = (px: number, py: number, pz: number) => project(px, py, pz, s, ox, oy, tilt, qrSize);

  const tl = p(x, y, z + 1);
  const tr = p(x + 1, y, z + 1);
  const fr = p(x + 1, y + 1, z + 1);
  const bl = p(x, y + 1, z + 1);

  ctx.fillStyle = adj(blendedColor, 1.05);
  ctx.beginPath();
  ctx.moveTo(tl.sx, tl.sy);
  ctx.lineTo(tr.sx, tr.sy);
  ctx.lineTo(fr.sx, fr.sy);
  ctx.lineTo(bl.sx, bl.sy);
  ctx.closePath();
  ctx.fill();

  const br = p(x + 1, y, z);
  const bf = p(x + 1, y + 1, z);
  const bb = p(x, y + 1, z);

  ctx.fillStyle = adj(blendedColor, 0.85);
  ctx.beginPath();
  ctx.moveTo(tr.sx, tr.sy);
  ctx.lineTo(fr.sx, fr.sy);
  ctx.lineTo(bf.sx, bf.sy);
  ctx.lineTo(br.sx, br.sy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = adj(blendedColor, 0.6);
  ctx.beginPath();
  ctx.moveTo(bl.sx, bl.sy);
  ctx.lineTo(fr.sx, fr.sy);
  ctx.lineTo(bf.sx, bf.sy);
  ctx.lineTo(bb.sx, bb.sy);
  ctx.closePath();
  ctx.fill();
}
