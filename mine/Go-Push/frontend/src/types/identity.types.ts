import type { BossArchetype } from './boss.types';

export interface QuestDefinition {
  id: string;
  description: string;
  durationSeconds: number;
  xpReward: number;
  bossId: string;
}

export interface MemoryShardMeta {
  compressedTokens: number;
  rawTokens: number;
  compressionRatio: number;
  promptCacheHit: boolean;
}

export interface IdentityRead {
  narrative: string;
  boss: BossArchetype;
  firstQuest: QuestDefinition;
  memoryShard: MemoryShardMeta;
}
