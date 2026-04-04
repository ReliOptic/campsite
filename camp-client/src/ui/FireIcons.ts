/**
 * FireIcons.ts
 *
 * Hand-crafted pixel-art fire-state icons for Campsite dashboard.
 * Every shape is a <rect>. No curves. No blur. No filters.
 * ViewBox: 32x32, designed for display at 64x64 or 96x96.
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const P = {
  // bulssi
  bulssiOrange: '#ff6600',
  bulssiAmber: '#ff8800',
  bulssiYellow: '#ffaa00',

  // modakbul
  modakRed: '#ff3300',
  modakOrange: '#ff6600',
  modakAmber: '#ffaa00',
  modakBright: '#ffdd44',

  // deungbul
  deungWarm: '#ffdd88',
  deungGold: '#ffcc66',
  deungDark: '#eebb44',

  // yeongi
  yeongiDark: '#666666',
  yeongiMid: '#888888',
  yeongiLight: '#aaaaaa',
  yeongiEmber: '#553333',

  // jangjak
  jangDark: '#8a6633',
  jangMid: '#aa7744',
  jangLight: '#cc8844',
} as const;

// ---------------------------------------------------------------------------
// SVG helpers
// ---------------------------------------------------------------------------
function r(x: number, y: number, w: number, h: number, fill: string, opacity?: number): string {
  const op = opacity !== undefined ? ` opacity="${opacity}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${op}/>`;
}

function svg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">${inner}</svg>`;
}

// ---------------------------------------------------------------------------
// 1. bulssi (spark) -- small, hopeful, just starting
// ---------------------------------------------------------------------------
function bulssi(): string {
  const rects = [
    // tiny base (2px wide)
    r(15, 22, 2, 1, P.bulssiOrange),
    // body
    r(15, 20, 2, 2, P.bulssiAmber),
    // narrow middle
    r(15, 18, 2, 2, P.bulssiYellow),
    // tip
    r(16, 16, 1, 2, P.bulssiYellow),
    // bright tip
    r(16, 15, 1, 1, P.bulssiYellow, 0.8),
  ];
  return svg(rects.join(''));
}

// ---------------------------------------------------------------------------
// 2. modakbul (bonfire) -- powerful, active, energetic
// ---------------------------------------------------------------------------
function modakbul(): string {
  const rects = [
    // === log base ===
    r(10, 27, 12, 2, P.jangDark),
    r(9, 29, 14, 2, P.jangMid),
    r(11, 31, 10, 1, P.jangLight),

    // === fire base (wide, dark orange-red) ===
    r(12, 24, 8, 3, P.modakRed),
    r(11, 23, 10, 2, P.modakOrange),

    // === body (tall flame columns) ===
    // left tongue
    r(12, 18, 2, 5, P.modakOrange),
    r(12, 15, 2, 3, P.modakAmber),
    r(13, 13, 1, 2, P.modakBright),

    // center tongue (tallest)
    r(14, 16, 4, 7, P.modakOrange),
    r(15, 12, 2, 4, P.modakAmber),
    r(15, 9, 2, 3, P.modakBright),
    r(16, 7, 1, 2, P.modakBright, 0.9),

    // right tongue
    r(18, 18, 2, 5, P.modakOrange),
    r(18, 15, 2, 3, P.modakAmber),
    r(18, 13, 1, 2, P.modakBright),

    // === sparks (isolated 1x1 above flame) ===
    r(14, 6, 1, 1, P.modakBright, 0.9),
    r(19, 8, 1, 1, P.modakBright, 0.7),
    r(11, 10, 1, 1, P.modakBright, 0.6),
  ];
  return svg(rects.join(''));
}

// ---------------------------------------------------------------------------
// 3. deungbul (lantern) -- calm, steady, waiting
// ---------------------------------------------------------------------------
function deungbul(): string {
  const rects = [
    // === handle ===
    r(14, 5, 4, 1, P.jangDark),
    r(15, 4, 2, 1, P.jangDark),

    // === lantern frame (outer) ===
    r(12, 6, 8, 1, P.jangMid),   // top edge
    r(12, 6, 1, 18, P.jangMid),  // left edge
    r(19, 6, 1, 18, P.jangMid),  // right edge
    r(12, 23, 8, 1, P.jangMid),  // bottom edge

    // === inner glow ===
    r(13, 7, 6, 16, P.deungWarm),
    r(14, 9, 4, 12, P.deungGold),
    r(15, 11, 2, 8, P.deungWarm, 0.9),

    // === lantern base ===
    r(11, 24, 10, 1, P.jangDark),
    r(12, 25, 8, 1, P.jangMid),

    // === light rays (sparse 1x1 dots) ===
    r(10, 10, 1, 1, P.deungWarm, 0.4),
    r(10, 16, 1, 1, P.deungWarm, 0.3),
    r(21, 12, 1, 1, P.deungWarm, 0.4),
    r(21, 18, 1, 1, P.deungWarm, 0.3),
    r(9, 13, 1, 1, P.deungWarm, 0.2),
    r(22, 15, 1, 1, P.deungWarm, 0.2),
  ];
  return svg(rects.join(''));
}

// ---------------------------------------------------------------------------
// 4. yeongi (smoke) -- stalled, needs attention
// ---------------------------------------------------------------------------
function yeongi(): string {
  const rects = [
    // === ember base ===
    r(14, 27, 4, 2, P.yeongiEmber),
    r(15, 26, 2, 1, P.yeongiEmber, 0.7),

    // === smoke column 1 (left) ===
    r(13, 23, 1, 1, P.yeongiDark),
    r(12, 21, 1, 1, P.yeongiDark, 0.9),
    r(13, 19, 1, 1, P.yeongiMid),
    r(12, 17, 1, 1, P.yeongiMid, 0.8),
    r(13, 15, 1, 1, P.yeongiLight, 0.6),
    r(12, 13, 1, 1, P.yeongiLight, 0.4),

    // === smoke column 2 (center-left) ===
    r(15, 24, 1, 1, P.yeongiDark),
    r(15, 22, 1, 1, P.yeongiDark, 0.9),
    r(14, 20, 1, 1, P.yeongiMid),
    r(15, 18, 1, 1, P.yeongiMid, 0.7),
    r(14, 16, 1, 1, P.yeongiLight, 0.5),
    r(15, 14, 1, 1, P.yeongiLight, 0.3),

    // === smoke column 3 (center-right) ===
    r(17, 24, 1, 1, P.yeongiDark),
    r(17, 22, 1, 1, P.yeongiMid),
    r(18, 20, 1, 1, P.yeongiMid, 0.8),
    r(17, 18, 1, 1, P.yeongiLight, 0.6),
    r(18, 16, 1, 1, P.yeongiLight, 0.4),

    // === smoke column 4 (right) ===
    r(19, 23, 1, 1, P.yeongiDark, 0.8),
    r(20, 21, 1, 1, P.yeongiMid, 0.7),
    r(19, 19, 1, 1, P.yeongiMid, 0.5),
    r(20, 17, 1, 1, P.yeongiLight, 0.4),
    r(19, 15, 1, 1, P.yeongiLight, 0.2),
  ];
  return svg(rects.join(''));
}

// ---------------------------------------------------------------------------
// 5. jangjak (firewood) -- prepared, patient, ready
// ---------------------------------------------------------------------------
function jangjak(): string {
  const rects = [
    // === bottom log ===
    r(7, 26, 18, 3, P.jangDark),

    // === second log (slightly offset) ===
    r(9, 22, 16, 3, P.jangMid),

    // === third log ===
    r(8, 18, 17, 3, P.jangLight),

    // === top log ===
    r(10, 14, 14, 3, P.jangMid),

    // === bark texture (subtle 1x1 accents) ===
    r(10, 27, 1, 1, P.jangLight, 0.5),
    r(18, 26, 1, 1, P.jangLight, 0.4),
    r(12, 23, 1, 1, P.jangLight, 0.5),
    r(20, 22, 1, 1, P.jangDark, 0.6),
    r(11, 19, 1, 1, P.jangDark, 0.4),
    r(19, 18, 1, 1, P.jangDark, 0.5),
    r(14, 15, 1, 1, P.jangLight, 0.4),
    r(20, 14, 1, 1, P.jangDark, 0.5),

    // === readiness spark (single dot) ===
    r(16, 11, 1, 1, '#ffaa00', 0.5),
  ];
  return svg(rects.join(''));
}

// ---------------------------------------------------------------------------
// Icon registry
// ---------------------------------------------------------------------------
const ICONS: Record<string, () => string> = {
  bulssi,
  modakbul,
  deungbul,
  yeongi,
  jangjak,
};

/**
 * Returns an inline SVG string for the given fire-state.
 * Falls back to `jangjak` if the state is unknown.
 */
export function getFireIcon(state: string): string {
  const fn = ICONS[state] ?? ICONS['jangjak'];
  return fn();
}

// ---------------------------------------------------------------------------
// Animation CSS
// ---------------------------------------------------------------------------
const FIRE_STYLES = `
.fire-bulssi {
  animation: fire-bulssi-flicker 8s ease-in-out infinite;
}
@keyframes fire-bulssi-flicker {
  0%, 60% { opacity: 1; }
  70% { opacity: 0.85; }
  85% { opacity: 0.92; }
  100% { opacity: 1; }
}

.fire-modakbul {
  animation: fire-modakbul-pulse 7s ease-in-out infinite;
}
@keyframes fire-modakbul-pulse {
  0%, 40% { opacity: 1; transform: scale(1); }
  55% { opacity: 0.92; transform: scale(0.99); }
  70% { opacity: 1; transform: scale(1.01); }
  100% { opacity: 1; transform: scale(1); }
}

.fire-deungbul {
  animation: fire-deungbul-glow 12s ease-in-out infinite;
}
@keyframes fire-deungbul-glow {
  0%, 80% { opacity: 1; }
  90% { opacity: 0.95; }
  100% { opacity: 1; }
}

.fire-yeongi {
  animation: fire-yeongi-drift 14s ease-in-out infinite;
}
@keyframes fire-yeongi-drift {
  0%, 50% { transform: translateY(0); opacity: 0.55; }
  80% { transform: translateY(-1px); opacity: 0.5; }
  100% { transform: translateY(0); opacity: 0.55; }
}

.fire-jangjak {
  /* static -- no animation */
}
`;

const ANIMATION_MAP: Record<string, string> = {
  bulssi: 'fire-bulssi',
  modakbul: 'fire-modakbul',
  deungbul: 'fire-deungbul',
  yeongi: 'fire-yeongi',
  jangjak: 'fire-jangjak',
};

/**
 * Returns the CSS animation class name for the given fire-state.
 */
export function getFireAnimation(state: string): string {
  return ANIMATION_MAP[state] ?? 'fire-jangjak';
}

let stylesInjected = false;

/**
 * Injects fire-state CSS animation styles into the document head (once).
 */
export function injectFireStyles(): void {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = FIRE_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}
