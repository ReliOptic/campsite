// Inbound events (Web → Unity)
export type UnityInboundEvent =
  | 'SET_MOOD'
  | 'CHANGE_SCENE'
  | 'SET_BOSS'
  | 'SET_PHASE'
  | 'DEAL_DAMAGE';

// Outbound events (Unity → Web)
export type UnityOutboundEvent =
  | 'LOADED'
  | 'LOADING_PROGRESS'
  | 'SCENE_READY'
  | 'ANIMATION_DONE'
  | 'ERROR';

// Inbound payloads (Web → Unity)
export interface SetMoodPayload {
  vibe: 'calm' | 'heavy' | 'restless' | 'drift';
}

export interface ChangeScenePayload {
  step: number;
}

export interface SetBossPayload {
  id: string;
  hp: number;
}

export interface SetPhasePayload {
  phase: 'loading' | 'narrative' | 'boss' | 'quest' | 'complete';
}

export interface DealDamagePayload {
  amount: number;
}

// Outbound payloads (Unity → Web)
export interface LoadedPayload {
  buildSizeMB: number;
}

export interface LoadingProgressPayload {
  progress: number;
}

export interface SceneReadyPayload {
  scene: string;
}

export interface AnimationDonePayload {
  type: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// Mapped types for type-safe event dispatch and subscription
export interface UnityInboundPayloadMap {
  SET_MOOD: SetMoodPayload;
  CHANGE_SCENE: ChangeScenePayload;
  SET_BOSS: SetBossPayload;
  SET_PHASE: SetPhasePayload;
  DEAL_DAMAGE: DealDamagePayload;
}

export interface UnityOutboundPayloadMap {
  LOADED: LoadedPayload;
  LOADING_PROGRESS: LoadingProgressPayload;
  SCENE_READY: SceneReadyPayload;
  ANIMATION_DONE: AnimationDonePayload;
  ERROR: ErrorPayload;
}

// Unity WebGL loader instance API
export interface UnityInstance {
  SendMessage(objectName: string, methodName: string, value?: string | number): void;
  Quit(): Promise<void>;
}

// Discriminated union for outbound events received by the web
export type UnityOutboundMessage = {
  [K in UnityOutboundEvent]: { type: K } & UnityOutboundPayloadMap[K];
}[UnityOutboundEvent];
