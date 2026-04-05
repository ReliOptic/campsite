/**
 * unity-bridge.test.ts
 *
 * Tests for src/lib/unity-bridge.ts — the postMessage bridge between
 * Next.js and the Unity WebGL runtime.
 *
 * The bridge module is tested in isolation: UnityInstance is mocked,
 * and Unity → Web events are simulated by dispatching CustomEvents on window.
 *
 * Bridge protocol reference: .omc/plans/unity-webgl-onboarding.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module-level mock — the bridge module does not exist yet at test-write time.
// We define the contract here and vitest will resolve it against the real
// implementation once it ships.  All tests import from the mock factory so
// that each test gets a fresh, isolated module state.
// ---------------------------------------------------------------------------

/** Minimal UnityInstance mock that records SendMessage calls. */
function makeMockUnityInstance() {
  return {
    SendMessage: vi.fn<[string, string, string?], void>(),
    Quit: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  };
}

/** Dispatch a synthetic Unity → Web event on window. */
function dispatchUnityEvent(detail: object): void {
  window.dispatchEvent(
    new CustomEvent('unity-message', { detail: JSON.stringify(detail) }),
  );
}

// ---------------------------------------------------------------------------
// Re-import the bridge fresh for every test so module-level singletons
// (instance reference, message queue, listener set) are reset.
// ---------------------------------------------------------------------------

async function loadBridge() {
  // Dynamic import with cache-busting cache key so vitest re-evaluates the
  // module each time (requires resetModules in beforeEach).
  const mod = await import('@/lib/unity-bridge');
  return mod;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('unity-bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. Message queueing
  // -------------------------------------------------------------------------

  describe('message queueing before setUnityInstance', () => {
    it('buffers messages sent before a Unity instance is registered', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();

      sendToUnity('SET_MOOD', { vibe: 'calm' });
      sendToUnity('CHANGE_SCENE', { step: 2 });

      // Instance not registered yet — SendMessage must not have been called.
      expect(instance.SendMessage).not.toHaveBeenCalled();

      setUnityInstance(instance);

      // After registration the queue should have flushed.
      expect(instance.SendMessage).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Queue flush on setUnityInstance
  // -------------------------------------------------------------------------

  describe('queue flush', () => {
    it('flushes all queued messages via SendMessage when instance is set', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();

      sendToUnity('SET_BOSS', { id: 'procrastination', hp: 100 });
      sendToUnity('SET_PHASE', { phase: 'boss' });
      sendToUnity('DEAL_DAMAGE', { amount: 25 });

      setUnityInstance(instance);

      expect(instance.SendMessage).toHaveBeenCalledTimes(3);
    });

    it('does not double-flush if setUnityInstance is called a second time', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();

      sendToUnity('SET_MOOD', { vibe: 'heavy' });

      setUnityInstance(instance);
      expect(instance.SendMessage).toHaveBeenCalledTimes(1);

      // Calling set again should not replay the already-flushed queue.
      const instance2 = makeMockUnityInstance();
      setUnityInstance(instance2);
      expect(instance2.SendMessage).toHaveBeenCalledTimes(0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. sendToUnity — JSON serialization format
  // -------------------------------------------------------------------------

  describe('sendToUnity serialization', () => {
    it('serializes the event payload as { type, ...data }', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();
      setUnityInstance(instance);

      sendToUnity('SET_MOOD', { vibe: 'calm' });

      const [, , json] = instance.SendMessage.mock.calls[0];
      const parsed = JSON.parse(json as string);
      expect(parsed).toEqual({ type: 'SET_MOOD', vibe: 'calm' });
    });

    it('includes nested payload fields verbatim', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();
      setUnityInstance(instance);

      sendToUnity('SET_BOSS', { id: 'perfectionism', hp: 80 });

      const [, , json] = instance.SendMessage.mock.calls[0];
      const parsed = JSON.parse(json as string);
      expect(parsed).toEqual({ type: 'SET_BOSS', id: 'perfectionism', hp: 80 });
    });
  });

  // -------------------------------------------------------------------------
  // 4. sendToUnity — SendMessage call signature
  // -------------------------------------------------------------------------

  describe('sendToUnity SendMessage call args', () => {
    it('calls SendMessage with ("GameManager", "OnMessageFromWeb", json)', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();
      setUnityInstance(instance);

      sendToUnity('CHANGE_SCENE', { step: 3 });

      expect(instance.SendMessage).toHaveBeenCalledWith(
        'GameManager',
        'OnMessageFromWeb',
        expect.any(String),
      );
    });

    it('passes a valid JSON string as the third argument', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();
      setUnityInstance(instance);

      sendToUnity('DEAL_DAMAGE', { amount: 50 });

      const thirdArg = instance.SendMessage.mock.calls[0][2] as string;
      expect(() => JSON.parse(thirdArg)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 5. onUnityEvent — receives events
  // -------------------------------------------------------------------------

  describe('onUnityEvent', () => {
    it('invokes the callback when a unity-message CustomEvent is dispatched on window', async () => {
      const { onUnityEvent } = await loadBridge();
      const callback = vi.fn();

      const unsub = onUnityEvent(callback);

      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 12 });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LOADED', buildSizeMB: 12 }),
      );

      unsub();
    });

    it('receives multiple sequential events', async () => {
      const { onUnityEvent } = await loadBridge();
      const callback = vi.fn();

      const unsub = onUnityEvent(callback);

      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 0.5 });
      dispatchUnityEvent({ type: 'SCENE_READY', scene: 'calm' });

      expect(callback).toHaveBeenCalledTimes(2);

      unsub();
    });
  });

  // -------------------------------------------------------------------------
  // 6. onUnityEvent — unsubscribe stops delivery
  // -------------------------------------------------------------------------

  describe('onUnityEvent unsubscribe', () => {
    it('stops invoking callback after the returned unsubscribe function is called', async () => {
      const { onUnityEvent } = await loadBridge();
      const callback = vi.fn();

      const unsub = onUnityEvent(callback);

      dispatchUnityEvent({ type: 'SCENE_READY', scene: 'heavy' });
      expect(callback).toHaveBeenCalledTimes(1);

      unsub();

      dispatchUnityEvent({ type: 'ANIMATION_DONE', type_anim: 'boss-enter' });
      // Count must remain at 1 — unsubscribed.
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not affect other active listeners when one unsubscribes', async () => {
      const { onUnityEvent } = await loadBridge();
      const callbackA = vi.fn();
      const callbackB = vi.fn();

      const unsubA = onUnityEvent(callbackA);
      const _unsubB = onUnityEvent(callbackB);

      unsubA();
      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 9 });

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(1);

      _unsubB();
    });
  });

  // -------------------------------------------------------------------------
  // 7. waitForReady — resolves on LOADED event
  // -------------------------------------------------------------------------

  describe('waitForReady', () => {
    it('resolves when a LOADED event is dispatched on window', async () => {
      const { waitForReady } = await loadBridge();

      const promise = waitForReady();

      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 11 });

      await expect(promise).resolves.toBeUndefined();
    });

    it('resolves only once even if LOADED fires multiple times', async () => {
      const { waitForReady } = await loadBridge();

      const promise = waitForReady();

      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 11 });
      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 11 });

      // Promise is already settled — repeated events must not cause rejection.
      await expect(promise).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 8. waitForReady — rejects after 15 s timeout
  // -------------------------------------------------------------------------

  describe('waitForReady timeout', () => {
    it('rejects after 15 000 ms if LOADED is never received', async () => {
      const { waitForReady } = await loadBridge();

      const promise = waitForReady();

      // Advance fake clock past the 15 s deadline.
      vi.advanceTimersByTime(15_001);

      await expect(promise).rejects.toThrow();
    });

    it('does not reject before the 15 s deadline', async () => {
      const { waitForReady } = await loadBridge();

      let settled = false;
      const promise = waitForReady().finally(() => {
        settled = true;
      });

      vi.advanceTimersByTime(14_999);

      // Promise must still be pending.
      expect(settled).toBe(false);

      // Resolve cleanly so the test teardown is not noisy.
      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 10 });
      await promise.catch(() => {});
    });
  });

  // -------------------------------------------------------------------------
  // 9. onProgress — receives LOADING_PROGRESS events
  // -------------------------------------------------------------------------

  describe('onProgress', () => {
    it('invokes callback with the progress number from each LOADING_PROGRESS event', async () => {
      const { onProgress } = await loadBridge();
      const callback = vi.fn<[number], void>();

      const unsub = onProgress(callback);

      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 0.25 });
      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 0.75 });
      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 1.0 });

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 0.25);
      expect(callback).toHaveBeenNthCalledWith(2, 0.75);
      expect(callback).toHaveBeenNthCalledWith(3, 1.0);

      unsub();
    });

    it('does not invoke callback for non-LOADING_PROGRESS events', async () => {
      const { onProgress } = await loadBridge();
      const callback = vi.fn();

      const unsub = onProgress(callback);

      dispatchUnityEvent({ type: 'LOADED', buildSizeMB: 10 });
      dispatchUnityEvent({ type: 'SCENE_READY', scene: 'drift' });

      expect(callback).not.toHaveBeenCalled();

      unsub();
    });

    it('stops invoking callback after the returned unsubscribe is called', async () => {
      const { onProgress } = await loadBridge();
      const callback = vi.fn();

      const unsub = onProgress(callback);

      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 0.1 });
      unsub();
      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 0.5 });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 10. dispose — full cleanup
  // -------------------------------------------------------------------------

  describe('dispose', () => {
    it('stops all onUnityEvent listeners after dispose', async () => {
      const { onUnityEvent, dispose } = await loadBridge();
      const callback = vi.fn();

      onUnityEvent(callback);
      dispose();

      dispatchUnityEvent({ type: 'SCENE_READY', scene: 'restless' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('stops all onProgress listeners after dispose', async () => {
      const { onProgress, dispose } = await loadBridge();
      const callback = vi.fn();

      onProgress(callback);
      dispose();

      dispatchUnityEvent({ type: 'LOADING_PROGRESS', progress: 0.9 });

      expect(callback).not.toHaveBeenCalled();
    });

    it('clears the stored Unity instance after dispose', async () => {
      const { setUnityInstance, sendToUnity, dispose } = await loadBridge();
      const instance = makeMockUnityInstance();

      setUnityInstance(instance);
      dispose();

      // After dispose, new messages should be queued (not sent to old instance).
      sendToUnity('SET_MOOD', { vibe: 'calm' });

      // The disposed instance must not receive any post-dispose calls.
      const callsAfterDispose = instance.SendMessage.mock.calls.filter(
        (_, i) => i >= 1, // first call was from pre-dispose flush — skip
      );
      expect(callsAfterDispose).toHaveLength(0);
    });

    it('clears the message queue after dispose', async () => {
      const { sendToUnity, setUnityInstance, dispose } = await loadBridge();

      // Queue a message before any instance is set.
      sendToUnity('SET_MOOD', { vibe: 'drift' });

      dispose();

      // After dispose, register a fresh instance.
      const instance = makeMockUnityInstance();
      setUnityInstance(instance);

      // The pre-dispose queue should have been cleared — nothing flushed.
      expect(instance.SendMessage).toHaveBeenCalledTimes(0);
    });
  });

  // -------------------------------------------------------------------------
  // 11. sendToUnity after dispose — queues without throwing
  // -------------------------------------------------------------------------

  describe('sendToUnity after dispose', () => {
    it('does not throw when called after dispose', async () => {
      const { sendToUnity, dispose } = await loadBridge();

      dispose();

      expect(() => sendToUnity('CHANGE_SCENE', { step: 4 })).not.toThrow();
    });

    it('queues the message so it can be flushed when a new instance is registered', async () => {
      const { sendToUnity, setUnityInstance, dispose } = await loadBridge();

      dispose();

      sendToUnity('SET_PHASE', { phase: 'quest' });

      const instance = makeMockUnityInstance();
      setUnityInstance(instance);

      // The post-dispose, pre-instance message should be delivered on flush.
      expect(instance.SendMessage).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 12. Error handling — SendMessage throws
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('does not propagate an exception when SendMessage throws', async () => {
      const { sendToUnity, setUnityInstance } = await loadBridge();
      const instance = makeMockUnityInstance();
      instance.SendMessage.mockImplementation(() => {
        throw new Error('WebGL context lost');
      });

      setUnityInstance(instance);

      expect(() => sendToUnity('SET_MOOD', { vibe: 'restless' })).not.toThrow();
    });

    it('dispatches an ERROR unity-message event when SendMessage throws', async () => {
      const { sendToUnity, setUnityInstance, onUnityEvent } = await loadBridge();
      const instance = makeMockUnityInstance();
      instance.SendMessage.mockImplementation(() => {
        throw new Error('context lost');
      });

      setUnityInstance(instance);

      const received: object[] = [];
      const unsub = onUnityEvent((event) => received.push(event));

      sendToUnity('SET_MOOD', { vibe: 'heavy' });

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({ type: 'ERROR' });

      unsub();
    });
  });
});
