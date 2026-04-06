using UnityEngine;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

/// <summary>
/// WebGL/JS interop bridge with type registry for message handling.
/// Inbound messages are routed via handler dictionary (no switch-case).
/// </summary>
public class WebBridge : MonoBehaviour
{
    public static WebBridge Instance { get; private set; }

    [Header("Scene References")]
    [SerializeField] private SceneController sceneController;
    [SerializeField] private ParticleController particleController;
    [SerializeField] private LightingController lightingController;

    private readonly Dictionary<string, Action<string>> _handlers = new();

    public void Inject(SceneController sc, ParticleController pc, LightingController lc)
    {
        sceneController = sc;
        particleController = pc;
        lightingController = lc;
        RegisterHandlers();
    }

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void SendToWeb(string json);
#else
    private static void SendToWeb(string json)
    {
        Debug.Log($"[WebBridge] SendToWeb: {json}");
    }
#endif

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void Start()
    {
        if (_handlers.Count == 0) RegisterHandlers();
        string json = JsonUtility.ToJson(new OutboundPayload { type = "LOADED" });
        SendToWeb(json);
    }

    // ─── Handler Registry ────────────────────────────────────────

    private void RegisterHandlers()
    {
        _handlers["SET_MOOD"] = HandleSetMood;
        _handlers["CHANGE_SCENE"] = HandleChangeScene;
        _handlers["SET_THRESHOLD"] = HandleSetThreshold;
        _handlers["SET_PHASE"] = HandleSetPhase;
        _handlers["ILLUMINATE"] = HandleIlluminate;
        _handlers["START_PUZZLE"] = HandleStartPuzzle;
    }

    /// <summary>
    /// Called from JavaScript via unityInstance.SendMessage('GameManager', 'OnMessageFromWeb', json)
    /// </summary>
    public void OnMessageFromWeb(string json)
    {
        var msg = JsonUtility.FromJson<InboundMessage>(json);
        if (msg == null || string.IsNullOrEmpty(msg.type))
        {
            Debug.LogWarning($"[WebBridge] Failed to parse message: {json}");
            return;
        }

        if (_handlers.TryGetValue(msg.type, out var handler))
        {
            handler(json);
        }
        else
        {
            Debug.LogWarning($"[WebBridge] Unknown message type: {msg.type}");
        }
    }

    // ─── Handlers ────────────────────────────────────────────────

    private void HandleSetMood(string json)
    {
        var payload = JsonUtility.FromJson<SetMoodPayload>(json);
        if (sceneController != null) sceneController.SetMood(payload.vibe);
        if (particleController != null) particleController.SetMood(payload.vibe);
        if (lightingController != null) lightingController.SetMood(payload.vibe);
    }

    private void HandleChangeScene(string json)
    {
        var payload = JsonUtility.FromJson<ChangeScenePayload>(json);
        if (sceneController != null) sceneController.SetStep(payload.step);
    }

    private void HandleSetThreshold(string json)
    {
        var payload = JsonUtility.FromJson<SetThresholdPayload>(json);
        if (sceneController != null) sceneController.RevealThreshold(payload.id, payload.layers);
    }

    private void HandleSetPhase(string json)
    {
        var payload = JsonUtility.FromJson<SetPhasePayload>(json);
        if (sceneController != null) sceneController.SetRevealPhase(payload.phase);
    }

    private void HandleIlluminate(string json)
    {
        var payload = JsonUtility.FromJson<IlluminatePayload>(json);
        if (sceneController != null) sceneController.PlayIlluminateEffect(payload.intensity);
    }

    private void HandleStartPuzzle(string json)
    {
        var payload = JsonUtility.FromJson<StartPuzzlePayload>(json);
        if (sceneController != null) sceneController.StartPuzzle(payload.seed);
    }

    // ─── Outbound API ────────────────────────────────────────────

    public void SendSceneReady(string scene)
    {
        SendToWeb(JsonUtility.ToJson(new SceneReadyPayload { type = "SCENE_READY", scene = scene }));
    }

    public void SendAnimationDone(string animationType)
    {
        SendToWeb(JsonUtility.ToJson(new AnimationDonePayload { type = "ANIMATION_DONE", animationType = animationType }));
    }

    public void SendTelemetry(string json)
    {
        SendToWeb(json);
    }

    public void SendError(string code, string message)
    {
        SendToWeb(JsonUtility.ToJson(new ErrorPayload { type = "ERROR", code = code, message = message }));
    }

    public void SendLoadingProgress(float progress)
    {
        SendToWeb(JsonUtility.ToJson(new LoadingProgressPayload { type = "LOADING_PROGRESS", progress = progress }));
    }

    // ─── Payload Types ───────────────────────────────────────────

    // Inbound
    [Serializable] private class InboundMessage { public string type; }
    [Serializable] private class SetMoodPayload { public string type; public string vibe; }
    [Serializable] private class ChangeScenePayload { public string type; public int step; }
    [Serializable] private class SetThresholdPayload { public string type; public string id; public int layers; }
    [Serializable] private class SetPhasePayload { public string type; public string phase; }
    [Serializable] private class IlluminatePayload { public string type; public int intensity; }
    [Serializable] private class StartPuzzlePayload { public string type; public int seed; }

    // Outbound
    [Serializable] private class OutboundPayload { public string type; }
    [Serializable] private class LoadingProgressPayload { public string type; public float progress; }
    [Serializable] private class SceneReadyPayload { public string type; public string scene; }
    [Serializable] private class AnimationDonePayload { public string type; public string animationType; }
    [Serializable] private class ErrorPayload { public string type; public string code; public string message; }
}
