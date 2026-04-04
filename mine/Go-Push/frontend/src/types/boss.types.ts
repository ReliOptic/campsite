export type BossId = 'fog' | 'judge' | 'drift' | 'mirror' | 'clock';
export type BossVisual = 'misty' | 'stone' | 'flowing' | 'reflective' | 'ticking';

export interface BossArchetype {
  id: BossId;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  weakness: string;
  visual: BossVisual;
}

export const BOSS_ARCHETYPES: Record<BossId, Omit<BossArchetype, 'hp'>> = {
  fog: {
    id: 'fog',
    name: 'The Fog',
    description: '첫 걸음을 가장 두려워하는 존재',
    maxHp: 800,
    weakness: 'First small action',
    visual: 'misty',
  },
  judge: {
    id: 'judge',
    name: 'The Judge',
    description: '완벽하지 않으면 시작할 수 없게 만드는 존재',
    maxHp: 1000,
    weakness: 'Imperfect attempts',
    visual: 'stone',
  },
  drift: {
    id: 'drift',
    name: 'The Drift',
    description: '집중을 흩어지게 만드는 존재',
    maxHp: 600,
    weakness: 'Focused 5-min blocks',
    visual: 'flowing',
  },
  mirror: {
    id: 'mirror',
    name: 'The Mirror',
    description: '자신을 의심하게 만드는 존재',
    maxHp: 900,
    weakness: 'Self-affirmation',
    visual: 'reflective',
  },
  clock: {
    id: 'clock',
    name: 'The Clock',
    description: '시간에 쫓기게 만드는 존재',
    maxHp: 700,
    weakness: 'Starting immediately',
    visual: 'ticking',
  },
};
