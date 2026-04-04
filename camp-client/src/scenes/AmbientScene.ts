import Phaser from 'phaser';

/* ------------------------------------------------------------------ */
/*  Fire-state glow presets                                           */
/* ------------------------------------------------------------------ */
interface GlowPreset {
  alpha: number;
  color: number; // 0xRRGGBB
}

const GLOW_PRESETS: Record<string, GlowPreset> = {
  bulssi:   { alpha: 0.03, color: 0xff8800 },
  modakbul: { alpha: 0.12, color: 0xff8800 },
  deungbul: { alpha: 0.08, color: 0xff8800 },
  yeongi:   { alpha: 0.04, color: 0x998866 }, // gray-shifted
  jangjak:  { alpha: 0.04, color: 0xcc7700 }, // amber
};

/* ------------------------------------------------------------------ */
/*  Star descriptor                                                   */
/* ------------------------------------------------------------------ */
interface Star {
  x: number;
  y: number;
  w: number;
  h: number;
  baseAlpha: number;
  period: number;   // twinkle period in ms
  phase: number;    // random offset
  phase2: number;   // second harmonic offset
  color: number;
}

/* ------------------------------------------------------------------ */
/*  Shooting star descriptor                                          */
/* ------------------------------------------------------------------ */
interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // remaining ms
  maxLife: number;
}

/* ------------------------------------------------------------------ */
/*  Ground mist descriptor                                            */
/* ------------------------------------------------------------------ */
interface MistLayer {
  y: number;
  alpha: number;
  speed: number;    // px per second
  offset: number;   // current x offset
  height: number;
}

/* ------------------------------------------------------------------ */
/*  AmbientScene — nighttime campsite atmosphere                      */
/* ------------------------------------------------------------------ */
export class AmbientScene extends Phaser.Scene {

  /* Graphics layers (drawn once, except glow) */
  private skyGfx!: Phaser.GameObjects.Graphics;
  private starGfx!: Phaser.GameObjects.Graphics;
  private mtFar!: Phaser.GameObjects.Graphics;
  private mtMid!: Phaser.GameObjects.Graphics;
  private mtNear!: Phaser.GameObjects.Graphics;
  private rimGfx!: Phaser.GameObjects.Graphics;
  private groundGfx!: Phaser.GameObjects.Graphics;
  private glowGfx!: Phaser.GameObjects.Graphics;

  /* State */
  private stars: Star[] = [];
  private glowPreset: GlowPreset = GLOW_PRESETS['modakbul'];
  private elapsed = 0;

  /* Shooting stars */
  private shootingStars: ShootingStar[] = [];
  private shootGfx!: Phaser.GameObjects.Graphics;
  private nextShootTime = 0; // ms until next shooting star

  /* Ground mist */
  private mistLayers: MistLayer[] = [];
  private mistGfx!: Phaser.GameObjects.Graphics;

  /* Cached mountain ridge points for rim-light */
  private nearRidge: { x: number; y: number }[] = [];

  constructor() {
    super({ key: 'AmbientScene' });
  }

  /* ================================================================ */
  /*  CREATE                                                          */
  /* ================================================================ */
  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    /* Read initial fire state from global */
    const campState = (window as unknown as Record<string, unknown>)['CAMP_STATE'] as
      | { fireState?: string }
      | undefined;
    if (campState?.fireState && GLOW_PRESETS[campState.fireState]) {
      this.glowPreset = GLOW_PRESETS[campState.fireState];
    }

    /* ---- Sky gradient -------------------------------------------- */
    this.skyGfx = this.add.graphics();
    this.drawSky(W, H);

    /* ---- Stars --------------------------------------------------- */
    this.starGfx = this.add.graphics();
    this.buildStars(W, H);

    /* ---- Mountains (back to front) ------------------------------- */
    this.mtFar  = this.add.graphics();
    this.mtMid  = this.add.graphics();
    this.mtNear = this.add.graphics();

    this.drawMountainLayer(this.mtFar,  W, H, {
      color: 0x0d0d25, baseY: H * 0.75, amplitude: H * 0.06,
      segments: 12, treeStyle: 'none',
    });
    this.drawMountainLayer(this.mtMid,  W, H, {
      color: 0x111130, baseY: H * 0.70, amplitude: H * 0.08,
      segments: 10, treeStyle: 'bump',
    });
    this.nearRidge = this.drawMountainLayer(this.mtNear, W, H, {
      color: 0x0a0a1a, baseY: H * 0.65, amplitude: H * 0.10,
      segments: 8, treeStyle: 'tree',
    });

    /* ---- Rim lighting on nearest ridge --------------------------- */
    this.rimGfx = this.add.graphics();
    this.drawRimLight(W, H);

    /* ---- Ground -------------------------------------------------- */
    this.groundGfx = this.add.graphics();
    this.drawGround(W, H);

    /* ---- Ground mist (very subtle, drifting) --------------------- */
    this.mistGfx = this.add.graphics();
    this.buildMistLayers(W, H);

    /* ---- Campfire glow (redrawn each frame) ---------------------- */
    this.glowGfx = this.add.graphics();

    /* ---- Shooting stars (rare, redrawn each frame) --------------- */
    this.shootGfx = this.add.graphics();
    this.nextShootTime = 30000 + Math.random() * 30000; // first one in 30-60s
  }

  /* ================================================================ */
  /*  UPDATE                                                          */
  /* ================================================================ */
  update(_time: number, delta: number): void {
    this.elapsed += delta;
    this.updateStars();
    this.updateGlow();
    this.updateShootingStars(delta);
    this.updateMist(delta);
  }

  /* ================================================================ */
  /*  PUBLIC API                                                      */
  /* ================================================================ */
  setFireState(state: string): void {
    if (GLOW_PRESETS[state]) {
      this.glowPreset = GLOW_PRESETS[state];
    }
  }

  /* ================================================================ */
  /*  SKY                                                             */
  /* ================================================================ */
  private drawSky(W: number, H: number): void {
    const g = this.skyGfx;
    const topR = 0x0a, topG = 0x0a, topB = 0x1a;
    const botR = 0x14, botG = 0x14, botB = 0x30;

    /* Row-by-row gradient */
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = Math.round(topR + (botR - topR) * t);
      const gv = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);

      /* Bottom 35%: add subtle warm tint */
      let fr = r, fg = gv, fb = b;
      if (t > 0.65) {
        const warmT = (t - 0.65) / 0.35; // 0..1
        fr = Math.min(255, fr + Math.round(12 * warmT));
        fg = Math.min(255, fg + Math.round(4 * warmT));
      }

      g.fillStyle(Phaser.Display.Color.GetColor(fr, fg, fb));
      g.fillRect(0, y, W, 1);
    }
  }

  /* ================================================================ */
  /*  STARS                                                           */
  /* ================================================================ */
  private buildStars(W: number, H: number): void {
    const maxY = H * 0.6;
    const centerX = W * 0.35;
    const centerXEnd = W * 0.65;
    const centerY = H * 0.15;
    const centerYEnd = H * 0.55;

    const avoid = (x: number, y: number): boolean =>
      x > centerX && x < centerXEnd && y > centerY && y < centerYEnd;

    const rng = (): number => Math.random();

    const place = (count: number, layer: 1 | 2 | 3): void => {
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        let attempts = 0;
        do {
          x = Math.floor(rng() * W);
          y = Math.floor(rng() * maxY);
          attempts++;
        } while (avoid(x, y) && attempts < 30);

        let w = 1, h = 1;
        let baseAlpha = 0.2 + rng() * 0.2;
        let period = 14000 + rng() * 6000;
        let color = 0xffffff;

        if (layer === 2) {
          w = rng() > 0.5 ? 2 : 1;
          baseAlpha = 0.3 + rng() * 0.2;
          period = 10000 + rng() * 6000;
        } else if (layer === 3) {
          w = 2; h = 2;
          baseAlpha = 0.4 + rng() * 0.3;
          period = 8000 + rng() * 4000;
          if (rng() > 0.6) color = 0xffeecc; // warm tint
        }

        this.stars.push({
          x, y, w, h,
          baseAlpha,
          period,
          phase: rng() * Math.PI * 2,
          phase2: rng() * Math.PI * 2,
          color,
        });
      }
    };

    place(25, 1);
    place(18, 2);
    place(10, 3);
  }

  private updateStars(): void {
    const g = this.starGfx;
    g.clear();
    const t = this.elapsed;
    for (const s of this.stars) {
      /* Dual-harmonic twinkle: primary slow wave + secondary irregular wave */
      const primary = 0.5 * Math.sin((t / s.period) * Math.PI * 2 + s.phase);
      const secondary = 0.3 * Math.sin((t / s.period) * Math.PI * 2 * 1.7 + s.phase2);
      const alpha = s.baseAlpha * Math.max(0, 0.5 + (primary + secondary) / 1.6);
      g.fillStyle(s.color, alpha);
      g.fillRect(s.x, s.y, s.w, s.h);
    }
  }

  /* ================================================================ */
  /*  MOUNTAINS                                                       */
  /* ================================================================ */
  private drawMountainLayer(
    gfx: Phaser.GameObjects.Graphics,
    W: number,
    H: number,
    opts: {
      color: number;
      baseY: number;
      amplitude: number;
      segments: number;
      treeStyle: 'none' | 'bump' | 'tree';
    },
  ): { x: number; y: number }[] {
    const { color, baseY, amplitude, segments, treeStyle } = opts;
    const ridge: { x: number; y: number }[] = [];

    /* Seed-like deterministic variation using simple hash */
    const segW = W / segments;

    /* Generate ridge heights */
    const heights: number[] = [];
    for (let i = 0; i <= segments; i++) {
      heights.push(baseY - amplitude * (0.3 + 0.7 * this.pseudoRandom(i * 137 + segments)));
    }

    /* Interpolate between segment points for smooth ridge */
    gfx.fillStyle(color);
    gfx.beginPath();
    gfx.moveTo(0, H);

    for (let px = 0; px <= W; px++) {
      const segIdx = Math.min(Math.floor(px / segW), segments - 1);
      const localT = (px - segIdx * segW) / segW;
      /* Cosine interpolation for smooth hills */
      const t2 = (1 - Math.cos(localT * Math.PI)) / 2;
      const y = heights[segIdx] * (1 - t2) + heights[segIdx + 1] * t2;
      gfx.lineTo(px, y);
      ridge.push({ x: px, y });
    }

    gfx.lineTo(W, H);
    gfx.closePath();
    gfx.fillPath();

    /* Tree silhouettes on the ridge line */
    if (treeStyle === 'bump') {
      this.drawTreeBumps(gfx, ridge, color);
    } else if (treeStyle === 'tree') {
      this.drawTreeSilhouettes(gfx, ridge, W);
    }

    return ridge;
  }

  /** Small 1-2px bumps representing distant tree line */
  private drawTreeBumps(
    gfx: Phaser.GameObjects.Graphics,
    ridge: { x: number; y: number }[],
    color: number,
  ): void {
    gfx.fillStyle(color);
    for (let i = 0; i < ridge.length; i += 3) {
      const p = ridge[i];
      const h = 1 + Math.round(this.pseudoRandom(i * 31) * 1);
      gfx.fillRect(p.x, p.y - h, 1, h);
    }
  }

  /** Individual tree shapes on nearest ridge */
  private drawTreeSilhouettes(
    gfx: Phaser.GameObjects.Graphics,
    ridge: { x: number; y: number }[],
    _W: number,
  ): void {
    const treeColor = 0x0a0a1a;
    gfx.fillStyle(treeColor);

    /* Place trees every 6-12px along the ridge */
    let nextTree = 0;
    for (let i = 0; i < ridge.length; i++) {
      if (i < nextTree) continue;
      const p = ridge[i];
      const seed = this.pseudoRandom(i * 73);
      const isPine = seed > 0.4;
      const treeH = 3 + Math.round(seed * 2); // 3-5px tall

      if (isPine) {
        /* Pine: triangular — draw as stacked rectangles narrowing upward */
        const halfBase = Math.floor(treeH / 2);
        for (let row = 0; row < treeH; row++) {
          const rowW = Math.max(1, halfBase - Math.floor(row * halfBase / treeH));
          gfx.fillRect(p.x - rowW, p.y - row - 1, rowW * 2 + 1, 1);
        }
        /* Trunk */
        gfx.fillRect(p.x, p.y, 1, 1);
      } else {
        /* Oak: rounded — wider rectangle cluster */
        const hw = Math.max(1, Math.floor(treeH * 0.6));
        const hh = Math.max(2, treeH - 1);
        /* Canopy: a squat rectangle with 1px indent on top row */
        for (let row = 0; row < hh; row++) {
          const indent = row === 0 || row === hh - 1 ? 1 : 0;
          gfx.fillRect(p.x - hw + indent, p.y - row - 2, (hw - indent) * 2 + 1, 1);
        }
        /* Trunk */
        gfx.fillRect(p.x, p.y - 1, 1, 2);
      }

      nextTree = i + 6 + Math.round(this.pseudoRandom(i * 47) * 6);
    }
  }

  /* ================================================================ */
  /*  RIM LIGHT                                                       */
  /* ================================================================ */
  private drawRimLight(W: number, _H: number): void {
    const g = this.rimGfx;
    const cx = W / 2;
    const rimColor = 0x331500;

    for (const p of this.nearRidge) {
      /* Intensity falls off with horizontal distance from center */
      const dist = Math.abs(p.x - cx) / (W / 2);
      const alpha = Math.max(0, 0.7 * (1 - dist * dist));
      if (alpha < 0.02) continue;
      g.fillStyle(rimColor, alpha);
      g.fillRect(p.x, p.y - 1, 1, 1);
    }
  }

  /* ================================================================ */
  /*  GROUND                                                          */
  /* ================================================================ */
  private drawGround(W: number, H: number): void {
    const g = this.groundGfx;
    const groundTop = Math.floor(H * 0.90);

    /* Dark earth */
    g.fillStyle(0x0f0f15);
    g.fillRect(0, groundTop, W, H - groundTop);

    /* Grass line — subtle textured 1px line */
    g.fillStyle(0x1a2a1a);
    for (let x = 0; x < W; x++) {
      if (this.pseudoRandom(x * 53) > 0.3) {
        g.fillRect(x, groundTop, 1, 1);
      }
    }
  }

  /* ================================================================ */
  /*  CAMPFIRE GLOW                                                   */
  /* ================================================================ */
  private updateGlow(): void {
    const g = this.glowGfx;
    g.clear();

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H - 20;
    const maxR = H * 0.4;

    /* Pulse: dual overlapping sine waves (10s + 17s) for organic, non-metronome feel */
    const wave1 = 0.07 * Math.sin((this.elapsed / 10000) * Math.PI * 2);
    const wave2 = 0.05 * Math.sin((this.elapsed / 17000) * Math.PI * 2);
    const pulse = 1 + wave1 + wave2;
    const baseAlpha = this.glowPreset.alpha * pulse;

    /* Decompose glow color */
    const cr = (this.glowPreset.color >> 16) & 0xff;
    const cg = (this.glowPreset.color >> 8) & 0xff;
    const cb = this.glowPreset.color & 0xff;
    const glowColor = Phaser.Display.Color.GetColor(cr, cg, cb);

    /* Draw radial glow as concentric filled rings (2px step for perf) */
    const step = 2;
    for (let r = maxR; r > 0; r -= step) {
      const t = 1 - r / maxR; // 0 at edge, 1 at center
      const alpha = baseAlpha * t * t; // quadratic falloff
      if (alpha < 0.002) continue;
      g.fillStyle(glowColor, alpha);
      g.fillRect(
        Math.floor(cx - r),
        Math.floor(cy - r),
        Math.ceil(r * 2),
        Math.ceil(r * 2),
      );
    }
  }

  /* ================================================================ */
  /*  UTIL                                                            */
  /* ================================================================ */
  /** Simple deterministic pseudo-random [0,1) from a seed integer */
  private pseudoRandom(seed: number): number {
    let s = (seed * 9301 + 49297) % 233280;
    if (s < 0) s += 233280;
    return s / 233280;
  }

  /* ================================================================ */
  /*  SHOOTING STARS                                                   */
  /* ================================================================ */
  private updateShootingStars(delta: number): void {
    const g = this.shootGfx;
    g.clear();

    const W = this.scale.width;
    const H = this.scale.height;

    /* Spawn check */
    this.nextShootTime -= delta;
    if (this.nextShootTime <= 0) {
      /* Spawn a shooting star in the upper quarter */
      const startX = W * 0.5 + Math.random() * W * 0.5; // right half
      const startY = Math.random() * H * 0.25;
      this.shootingStars.push({
        x: startX,
        y: startY,
        vx: -(0.15 + Math.random() * 0.1),  // px per ms, moving left
        vy: 0.05 + Math.random() * 0.03,     // slight downward
        life: 1200 + Math.random() * 800,     // 1.2 - 2s lifespan
        maxLife: 0, // set below
      });
      this.shootingStars[this.shootingStars.length - 1].maxLife =
        this.shootingStars[this.shootingStars.length - 1].life;

      /* Next one in 30-60 seconds */
      this.nextShootTime = 30000 + Math.random() * 30000;
    }

    /* Update and draw */
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.life -= delta;
      if (s.life <= 0) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      s.x += s.vx * delta;
      s.y += s.vy * delta;

      /* Fade: bright at start, fading to nothing */
      const progress = 1 - s.life / s.maxLife;
      const alpha = Math.max(0, (1 - progress) * 0.6);

      /* Draw trail: 3-4 pixels along the velocity direction */
      for (let t = 0; t < 4; t++) {
        const trailAlpha = alpha * (1 - t * 0.25);
        if (trailAlpha < 0.01) continue;
        g.fillStyle(0xffffff, trailAlpha);
        g.fillRect(
          Math.floor(s.x - s.vx * t * 2),
          Math.floor(s.y - s.vy * t * 2),
          1, 1,
        );
      }
    }
  }

  /* ================================================================ */
  /*  GROUND MIST                                                      */
  /* ================================================================ */
  private buildMistLayers(W: number, H: number): void {
    const baseY = H * 0.63; // mountain/ground boundary area
    this.mistLayers = [
      { y: baseY,     alpha: 0.025, speed: W / 50, offset: 0,          height: 2 },
      { y: baseY + 4, alpha: 0.02,  speed: W / 45, offset: W * 0.3,   height: 3 },
      { y: baseY + 8, alpha: 0.03,  speed: W / 55, offset: W * 0.6,   height: 2 },
    ];
  }

  private updateMist(delta: number): void {
    const g = this.mistGfx;
    g.clear();

    const W = this.scale.width;

    for (const m of this.mistLayers) {
      /* Very slow drift left-to-right, wrapping */
      m.offset += (m.speed * delta) / 1000;
      if (m.offset > W) m.offset -= W;

      /* Draw as a wide, low-alpha rectangle */
      const halfW = W * 0.6;
      const x = m.offset - halfW / 2;

      g.fillStyle(0x8899aa, m.alpha);

      /* Main body */
      if (x + halfW > W) {
        /* Wrapping: draw two segments */
        g.fillRect(Math.floor(x), Math.floor(m.y), Math.ceil(W - x), m.height);
        g.fillRect(0, Math.floor(m.y), Math.ceil(x + halfW - W), m.height);
      } else if (x < 0) {
        g.fillRect(0, Math.floor(m.y), Math.ceil(halfW + x), m.height);
        g.fillRect(Math.floor(W + x), Math.floor(m.y), Math.ceil(-x), m.height);
      } else {
        g.fillRect(Math.floor(x), Math.floor(m.y), Math.ceil(halfW), m.height);
      }
    }
  }
}
