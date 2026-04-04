import { describe, it, expect } from 'vitest';
import { BOSS_ARCHETYPES } from '@/types/boss.types';
import type { Vibe, Weight } from '@/types/onboarding.types';
import type { IdentityRead } from '@/types/identity.types';
import type { BossId } from '@/types/boss.types';

// Extract the fallback function logic from reveal.tsx for testing
function generateFallbackIdentity(
  vibe: string,
  weight: string,
): IdentityRead {
  const bossMap: Record<string, BossId> = {
    'calm-work': 'drift',
    'calm-health': 'fog',
    'calm-relationships': 'mirror',
    'calm-identity': 'mirror',
    'calm-time': 'clock',
    'heavy-work': 'judge',
    'heavy-health': 'fog',
    'heavy-relationships': 'mirror',
    'heavy-identity': 'judge',
    'heavy-time': 'clock',
    'restless-work': 'clock',
    'restless-health': 'drift',
    'restless-relationships': 'drift',
    'restless-identity': 'fog',
    'restless-time': 'clock',
    'drift-work': 'drift',
    'drift-health': 'fog',
    'drift-relationships': 'mirror',
    'drift-identity': 'fog',
    'drift-time': 'drift',
  };

  const key = `${vibe}-${weight}`;
  const bossId = bossMap[key] ?? 'fog';
  const archetype = BOSS_ARCHETYPES[bossId];

  return {
    narrative: `You carry a quiet weight. Something stirs beneath the surface, waiting. Today, you chose to notice it. That's already more than most people do.`,
    boss: { ...archetype, hp: archetype.maxHp },
    firstQuest: {
      id: `quest-${Date.now()}`,
      description: '지금 있는 자리에서 일어나서 창문을 열어봐',
      durationSeconds: 60,
      xpReward: 50,
      bossId,
    },
    memoryShard: {
      compressedTokens: 0,
      rawTokens: 0,
      compressionRatio: 0,
      promptCacheHit: false,
    },
  };
}

const ALL_VIBES: Vibe[] = ['calm', 'heavy', 'restless', 'drift'];
const ALL_WEIGHTS: Weight[] = ['work', 'health', 'relationships', 'identity', 'time'];

describe('generateFallbackIdentity', () => {
  it('produces valid identity for all 20 vibe×weight combos', () => {
    for (const vibe of ALL_VIBES) {
      for (const weight of ALL_WEIGHTS) {
        const identity = generateFallbackIdentity(vibe, weight);

        expect(identity.narrative).toBeTruthy();
        expect(identity.boss.id).toBeTruthy();
        expect(identity.boss.name).toBeTruthy();
        expect(identity.boss.hp).toBe(identity.boss.maxHp);
        expect(identity.boss.hp).toBeGreaterThan(0);
        expect(identity.boss.visual).toBeTruthy();
        expect(identity.firstQuest.durationSeconds).toBe(60);
        expect(identity.firstQuest.xpReward).toBe(50);
        expect(identity.firstQuest.bossId).toBe(identity.boss.id);
      }
    }
  });

  it('maps each vibe×weight to the correct boss', () => {
    const expected: Record<string, BossId> = {
      'calm-work': 'drift',
      'calm-health': 'fog',
      'calm-relationships': 'mirror',
      'calm-identity': 'mirror',
      'calm-time': 'clock',
      'heavy-work': 'judge',
      'heavy-health': 'fog',
      'heavy-relationships': 'mirror',
      'heavy-identity': 'judge',
      'heavy-time': 'clock',
      'restless-work': 'clock',
      'restless-health': 'drift',
      'restless-relationships': 'drift',
      'restless-identity': 'fog',
      'restless-time': 'clock',
      'drift-work': 'drift',
      'drift-health': 'fog',
      'drift-relationships': 'mirror',
      'drift-identity': 'fog',
      'drift-time': 'drift',
    };

    for (const [key, expectedBoss] of Object.entries(expected)) {
      const [vibe, weight] = key.split('-');
      const identity = generateFallbackIdentity(vibe, weight);
      expect(identity.boss.id).toBe(expectedBoss);
    }
  });

  it('defaults to fog for unknown vibe×weight', () => {
    const identity = generateFallbackIdentity('unknown', 'unknown');
    expect(identity.boss.id).toBe('fog');
  });

  it('boss hp equals maxHp (full health on spawn)', () => {
    const identity = generateFallbackIdentity('calm', 'work');
    expect(identity.boss.hp).toBe(identity.boss.maxHp);
  });

  it('all 5 boss archetypes are reachable', () => {
    const reachable = new Set<string>();
    for (const vibe of ALL_VIBES) {
      for (const weight of ALL_WEIGHTS) {
        const identity = generateFallbackIdentity(vibe, weight);
        reachable.add(identity.boss.id);
      }
    }
    expect(reachable).toEqual(new Set(['fog', 'judge', 'drift', 'mirror', 'clock']));
  });
});
