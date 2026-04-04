import { FireState } from '../systems/StateLoader';

/**
 * Korean display names for each fire state.
 */
const STATE_NAMES: Record<FireState, string> = {
  bulssi:   '불씨',
  modakbul: '모닥불',
  deungbul: '등불',
  yeongi:   '연기',
  jangjak:  '장작',
};

const STATE_LABELS: Record<FireState, string> = {
  bulssi:   '작은 불꽃이 피어오르고 있어요',
  modakbul: '활활 타오르고 있어요',
  deungbul: '고요하게 비추고 있어요',
  yeongi:   '연기만 피어오르고 있어요',
  jangjak:  '장작이 준비되어 있어요',
};

/**
 * Hand-crafted SVG icons for each fire state.
 * Built from simple rects and paths — no generated art.
 */
const STATE_SVGS: Record<FireState, string> = {
  bulssi: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="28" width="4" height="14" rx="1" fill="#ff6600" opacity="0.9">
      <animate attributeName="height" values="14;14;14;13;14;14" dur="8s" keyTimes="0;0.6;0.65;0.75;0.88;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="28;28;28;29;28;28" dur="8s" keyTimes="0;0.6;0.65;0.75;0.88;1" repeatCount="indefinite"/>
    </rect>
    <rect x="24" y="32" width="4" height="10" rx="1" fill="#ff8833" opacity="0.7">
      <animate attributeName="height" values="10;10;9;10;10" dur="9s" keyTimes="0;0.5;0.7;0.85;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="32;32;33;32;32" dur="9s" keyTimes="0;0.5;0.7;0.85;1" repeatCount="indefinite"/>
    </rect>
    <rect x="33" y="34" width="3" height="8" rx="1" fill="#ffaa44" opacity="0.6">
      <animate attributeName="height" values="8;8;7;8;8" dur="10s" keyTimes="0;0.55;0.72;0.88;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="34;34;35;34;34" dur="10s" keyTimes="0;0.55;0.72;0.88;1" repeatCount="indefinite"/>
    </rect>
    <rect x="22" y="42" width="20" height="3" rx="1" fill="#4a3020"/>
  </svg>`,

  modakbul: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="26" y="14" width="5" height="22" rx="1" fill="#ff6600">
      <animate attributeName="height" values="22;22;21;22;22" dur="7s" keyTimes="0;0.4;0.55;0.7;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="14;14;15;14;14" dur="7s" keyTimes="0;0.4;0.55;0.7;1" repeatCount="indefinite"/>
    </rect>
    <rect x="32" y="18" width="5" height="18" rx="1" fill="#ffaa00">
      <animate attributeName="height" values="18;18;17;18;18" dur="8s" keyTimes="0;0.45;0.6;0.75;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="18;18;19;18;18" dur="8s" keyTimes="0;0.45;0.6;0.75;1" repeatCount="indefinite"/>
    </rect>
    <rect x="20" y="22" width="4" height="14" rx="1" fill="#ff4400" opacity="0.8">
      <animate attributeName="height" values="14;14;13;14;14" dur="9s" keyTimes="0;0.5;0.65;0.8;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="22;22;23;22;22" dur="9s" keyTimes="0;0.5;0.65;0.8;1" repeatCount="indefinite"/>
    </rect>
    <rect x="38" y="20" width="4" height="16" rx="1" fill="#ff8800" opacity="0.7">
      <animate attributeName="height" values="16;16;15;16;16" dur="7.5s" keyTimes="0;0.35;0.55;0.72;1" repeatCount="indefinite"/>
      <animate attributeName="y" values="20;20;21;20;20" dur="7.5s" keyTimes="0;0.35;0.55;0.72;1" repeatCount="indefinite"/>
    </rect>
    <rect x="22" y="26" width="3" height="10" rx="1" fill="#ffcc44" opacity="0.6">
      <animate attributeName="height" values="10;10;9;10;10" dur="8.5s" keyTimes="0;0.5;0.68;0.82;1" repeatCount="indefinite"/>
    </rect>
    <rect x="36" y="24" width="3" height="12" rx="1" fill="#ffdd66" opacity="0.5">
      <animate attributeName="height" values="12;12;11;12;12" dur="9.5s" keyTimes="0;0.42;0.6;0.78;1" repeatCount="indefinite"/>
    </rect>
    <rect x="29" y="20" width="4" height="16" rx="1" fill="#ffdd44" opacity="0.5">
      <animate attributeName="height" values="16;16;15;16;16" dur="8s" keyTimes="0;0.48;0.62;0.8;1" repeatCount="indefinite"/>
    </rect>
    <rect x="24" y="30" width="3" height="6" rx="1" fill="#ffaa00" opacity="0.4">
      <animate attributeName="height" values="6;6;5;6;6" dur="10s" keyTimes="0;0.5;0.7;0.85;1" repeatCount="indefinite"/>
    </rect>
    <rect x="18" y="42" width="28" height="4" rx="1" fill="#4a3020"/>
    <rect x="20" y="40" width="24" height="3" rx="1" fill="#5e3d18"/>
  </svg>`,

  deungbul: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Hook -->
    <rect x="30" y="6" width="4" height="4" rx="1" fill="#665544"/>
    <rect x="31" y="10" width="2" height="6" fill="#665544"/>
    <!-- Frame -->
    <rect x="22" y="16" width="20" height="28" rx="2" fill="none" stroke="#886644" stroke-width="2"/>
    <!-- Top bar -->
    <rect x="24" y="16" width="16" height="3" rx="1" fill="#886644"/>
    <!-- Bottom bar -->
    <rect x="24" y="42" width="16" height="3" rx="1" fill="#886644"/>
    <!-- Glow pane -->
    <rect x="24" y="19" width="16" height="23" rx="1" fill="#ffdd88" opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.3;0.38;0.3" dur="12s" keyTimes="0;0.8;0.9;1" repeatCount="indefinite"/>
    </rect>
    <!-- Inner flame -->
    <rect x="29" y="24" width="4" height="10" rx="1" fill="#ffdd88" opacity="0.8">
      <animate attributeName="opacity" values="0.8;0.8;0.72;0.8" dur="12s" keyTimes="0;0.78;0.9;1" repeatCount="indefinite"/>
    </rect>
    <rect x="30" y="22" width="3" height="6" rx="1" fill="#fff4e0" opacity="0.6">
      <animate attributeName="opacity" values="0.6;0.6;0.52;0.6" dur="14s" keyTimes="0;0.8;0.92;1" repeatCount="indefinite"/>
    </rect>
  </svg>`,

  yeongi: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 48 Q26 40 30 34 Q28 28 32 22 Q30 16 34 10" stroke="#888888" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5">
      <animate attributeName="d" values="M28 48 Q26 40 30 34 Q28 28 32 22 Q30 16 34 10;M29 48 Q31 40 29 34 Q30 28 30 22 Q31 16 32 10;M28 48 Q26 40 30 34 Q28 28 32 22 Q30 16 34 10" dur="14s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0.5;0.42;0.5" dur="14s" keyTimes="0;0.5;0.8;1" repeatCount="indefinite"/>
    </path>
    <path d="M36 48 Q38 42 34 36 Q36 30 32 24" stroke="#999999" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.35">
      <animate attributeName="d" values="M36 48 Q38 42 34 36 Q36 30 32 24;M35 48 Q34 42 35 36 Q34 30 34 24;M36 48 Q38 42 34 36 Q36 30 32 24" dur="16s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.35;0.35;0.28;0.35" dur="16s" keyTimes="0;0.55;0.82;1" repeatCount="indefinite"/>
    </path>
    <path d="M22 48 Q20 44 24 38 Q22 32 26 26" stroke="#777777" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.3">
      <animate attributeName="d" values="M22 48 Q20 44 24 38 Q22 32 26 26;M23 48 Q24 44 23 38 Q24 32 24 26;M22 48 Q20 44 24 38 Q22 32 26 26" dur="18s" repeatCount="indefinite"/>
    </path>
    <rect x="18" y="48" width="28" height="3" rx="1" fill="#3a2a1a"/>
  </svg>`,

  jangjak: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Bottom log -->
    <rect x="12" y="42" width="40" height="6" rx="2" fill="#5e3d18"/>
    <rect x="12" y="42" width="40" height="2" rx="1" fill="#7a4f28"/>
    <!-- Middle log -->
    <rect x="16" y="34" width="32" height="6" rx="2" fill="#4a3010"/>
    <rect x="16" y="34" width="32" height="2" rx="1" fill="#6a4420"/>
    <!-- Top log -->
    <rect x="20" y="26" width="24" height="6" rx="2" fill="#5e3d18"/>
    <rect x="20" y="26" width="24" height="2" rx="1" fill="#7a4f28"/>
    <!-- Cross grain lines -->
    <rect x="14" y="44" width="1" height="3" fill="#4a3010" opacity="0.5"/>
    <rect x="26" y="44" width="1" height="3" fill="#4a3010" opacity="0.5"/>
    <rect x="38" y="44" width="1" height="3" fill="#4a3010" opacity="0.5"/>
    <rect x="22" y="36" width="1" height="3" fill="#3a2008" opacity="0.5"/>
    <rect x="34" y="36" width="1" height="3" fill="#3a2008" opacity="0.5"/>
    <rect x="26" y="28" width="1" height="3" fill="#4a3010" opacity="0.5"/>
    <rect x="36" y="28" width="1" height="3" fill="#4a3010" opacity="0.5"/>
  </svg>`,
};

/**
 * FireStateHero — the visual hero of the dashboard.
 * Displays the current fire state as an animated SVG icon with Korean label.
 */
export class FireStateHero {
  private container: HTMLElement;
  private iconEl: HTMLElement;
  private nameEl: HTMLElement;
  private labelEl: HTMLElement;
  private currentState: FireState = 'bulssi';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'fire-hero';

    this.iconEl = document.createElement('div');
    this.iconEl.className = 'fire-hero__icon';

    this.nameEl = document.createElement('div');
    this.nameEl.className = 'fire-hero__name';

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'fire-hero__label';

    this.container.appendChild(this.iconEl);
    this.container.appendChild(this.nameEl);
    this.container.appendChild(this.labelEl);
    parent.appendChild(this.container);
  }

  update(state: FireState): void {
    if (state === this.currentState && this.iconEl.innerHTML) return;
    this.currentState = state;

    // Update SVG
    this.iconEl.innerHTML = STATE_SVGS[state];
    this.iconEl.className = `fire-hero__icon fire-hero__icon--${state}`;

    // Update text
    this.nameEl.textContent = STATE_NAMES[state];
    this.labelEl.textContent = STATE_LABELS[state];

    // Update CSS custom property for fire color
    const root = document.documentElement;
    root.style.setProperty('--fire-active', `var(--fire-${state})`);
  }
}
