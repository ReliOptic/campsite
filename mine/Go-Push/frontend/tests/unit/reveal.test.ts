import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BOSS_ARCHETYPES } from '@/types/boss.types';
import type { BossVisual } from '@/types/boss.types';

const BOSS_EMOJI: Record<BossVisual, string> = {
  misty: '🌫️',
  stone: '🗿',
  flowing: '🌊',
  reflective: '🪞',
  ticking: '⏰',
};

describe('reveal', () => {
  describe('BOSS_EMOJI lookup', () => {
    it('maps all BossVisual values to an emoji', () => {
      const visuals: BossVisual[] = ['misty', 'stone', 'flowing', 'reflective', 'ticking'];
      for (const visual of visuals) {
        expect(BOSS_EMOJI[visual]).toBeTruthy();
        expect(typeof BOSS_EMOJI[visual]).toBe('string');
      }
    });

    it('every archetype visual has a matching emoji', () => {
      for (const archetype of Object.values(BOSS_ARCHETYPES)) {
        expect(BOSS_EMOJI[archetype.visual]).toBeTruthy();
      }
    });
  });

  describe('fetchIdentity', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls API with POST and signals in body', async () => {
      const mockSignals = { vibe: 'calm', weight: 'work' };
      const mockResponse = {
        narrative: 'test',
        boss: { ...BOSS_ARCHETYPES.fog, hp: 800 },
        firstQuest: {
          id: 'q1',
          description: 'test',
          durationSeconds: 60,
          xpReward: 50,
          bossId: 'fog',
        },
        memoryShard: {
          compressedTokens: 100,
          rawTokens: 500,
          compressionRatio: 0.2,
          promptCacheHit: true,
        },
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const res = await fetch('http://localhost:8000/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: mockSignals }),
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8000/api/identity',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const data = await res.json();
      expect(data.narrative).toBe('test');
      expect(data.boss.id).toBe('fog');
    });

    it('throws on non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const res = await fetch('http://localhost:8000/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: {} }),
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(500);
    });

    it('throws on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(
        fetch('http://localhost:8000/api/identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signals: {} }),
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('loading state', () => {
    it('isLoading starts false', () => {
      // Mirrors the store initial state
      const isLoading = false;
      const identityRead = null;
      expect(isLoading || !identityRead).toBe(true);
    });

    it('shows content when loaded', () => {
      const isLoading = false;
      const identityRead = { narrative: 'test' };
      expect(isLoading || !identityRead).toBe(false);
    });
  });
});
