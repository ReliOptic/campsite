import type {
  UnityInstance,
  UnityInboundEvent,
  UnityInboundPayloadMap,
  UnityOutboundMessage,
} from '@/types/unity-bridge.types';

// Module-level singleton — survives route navigation
let unityInstance: UnityInstance | null = null;
const messageQueue: string[] = [];
const listeners: Array<(event: Event) => void> = [];

export function setUnityInstance(instance: UnityInstance): void {
  unityInstance = instance;
  // Flush queued messages sent before Unity was ready
  for (const json of messageQueue) {
    try {
      unityInstance.SendMessage('GameManager', 'OnMessageFromWeb', json);
    } catch (err) {
      console.warn('[unity-bridge] Failed to flush queued message:', err);
    }
  }
  messageQueue.length = 0;
}

export function sendToUnity<E extends UnityInboundEvent>(
  event: E,
  data: UnityInboundPayloadMap[E],
): void {
  const json = JSON.stringify({ type: event, ...data });
  if (unityInstance === null) {
    messageQueue.push(json);
    return;
  }
  try {
    unityInstance.SendMessage('GameManager', 'OnMessageFromWeb', json);
  } catch (err) {
    console.warn('[unity-bridge] SendMessage failed:', err);
    const errorPayload = JSON.stringify({
      type: 'ERROR',
      code: 'SEND_MESSAGE_FAILED',
      message: err instanceof Error ? err.message : String(err),
    });
    window.dispatchEvent(
      new CustomEvent('unity-message', { detail: errorPayload }),
    );
  }
}

export function onUnityEvent(
  callback: (message: UnityOutboundMessage) => void,
): () => void {
  const handler = (event: Event): void => {
    const customEvent = event as CustomEvent<string>;
    try {
      const message = JSON.parse(customEvent.detail) as UnityOutboundMessage;
      callback(message);
    } catch (err) {
      console.warn('[unity-bridge] Failed to parse unity-message event:', err);
    }
  };

  window.addEventListener('unity-message', handler);
  listeners.push(handler);

  return (): void => {
    window.removeEventListener('unity-message', handler);
    const idx = listeners.indexOf(handler);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function waitForReady(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const TIMEOUT_MS = 15_000;

    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('[unity-bridge] Timed out waiting for Unity LOADED event'));
    }, TIMEOUT_MS);

    const unsubscribe = onUnityEvent((message) => {
      if (message.type === 'LOADED') {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      }
    });
  });
}

export function onProgress(callback: (progress: number) => void): () => void {
  return onUnityEvent((message) => {
    if (message.type === 'LOADING_PROGRESS') {
      callback(message.progress);
    }
  });
}

export function dispose(): void {
  // Remove all registered listeners from window
  for (const handler of listeners) {
    window.removeEventListener('unity-message', handler);
  }
  listeners.length = 0;
  messageQueue.length = 0;
  unityInstance = null;
}
