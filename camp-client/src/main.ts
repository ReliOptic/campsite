import Phaser from 'phaser';
import { AmbientScene } from './scenes/AmbientScene';
import { Dashboard } from './ui/Dashboard';

/**
 * Campsite — ambient background renderer.
 *
 * The Phaser canvas sits at z-index:0 behind HTML/CSS UI elements.
 * It renders ONLY the atmospheric nighttime campsite background.
 *
 * Canvas is 480x320 logical pixels, scaled to fill the viewport.
 * pixelArt mode + nearest-neighbor filtering keeps everything crisp.
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,

  width: 480,
  height: 320,

  backgroundColor: '#0a0a1a',

  pixelArt: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Phaser.Scale.MAX_ZOOM,
  },

  scene: [AmbientScene],

  /* Background layer: no pointer events so clicks pass through to the UI */
  input: {
    mouse: { preventDefaultDown: false, preventDefaultUp: false, preventDefaultMove: false },
    touch: { capture: false },
  },

  callbacks: {
    postBoot: (game: Phaser.Game) => {
      const canvas = game.canvas;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
    },
  },
};

(window as unknown as Record<string, unknown>)['__campGame'] = new Phaser.Game(config);

// Initialize the HTML/CSS dashboard overlay
(window as unknown as Record<string, unknown>)['__campDashboard'] = new Dashboard();
