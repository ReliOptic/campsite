using UnityEngine;
using System.Runtime.InteropServices;

// WebGL ↔ JavaScript interop bridge. Attach to GameManager in AmbientSky scene.
public class WebBridge : MonoBehaviour
{
    public static WebBridge Instance { get; private set; }

    [Header("Scene References")]
    [SerializeField] private SceneController sceneController;
    [SerializeField] private ParticleController particleController;
    [SerializeField] private LightingController lightingController;

    public void Inject(SceneController sc, ParticleController pc, LightingController lc)
    {
        sceneController = sc;
        particleController = pc;
        lightingController = lc;
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
        string json = JsonUtility.ToJson(new LoadedPayload { type = "LOADED", buildSizeMB = 0f });
        SendToWeb(json);
    }

    /// <summary>
    /// Called from JavaScript via unityInstance.SendMessage('GameManager', 'OnMessageFromWeb', json)
    /// </summary>
    public void OnMessageFromWeb(string json)
    {
        var msg = JsonUtility.FromJson<BridgeMessage>(json);
        if (msg == null)
        {
            Debug.LogWarning($"[WebBridge] Failed to parse message: {json}");
            return;
        }

        switch (msg.type)
        {
            case "SET_MOOD":
                var moodPayload = JsonUtility.FromJson<SetMoodPayload>(json);
                if (sceneController != null)
                    sceneController.SetMood(moodPayload.vibe);
                if (particleController != null)
                    particleController.SetMood(moodPayload.vibe);
                if (lightingController != null)
                    lightingController.SetMood(moodPayload.vibe);
                break;

            case "CHANGE_SCENE":
                var scenePayload = JsonUtility.FromJson<ChangeScenePayload>(json);
                if (sceneController != null)
                    sceneController.SetStep(scenePayload.step);
                break;

            case "SET_BOSS":
                var bossPayload = JsonUtility.FromJson<SetBossPayload>(json);
                if (sceneController != null)
                    sceneController.ShowBoss(bossPayload.id, bossPayload.hp);
                break;

            case "SET_PHASE":
                var phasePayload = JsonUtility.FromJson<SetPhasePayload>(json);
                if (sceneController != null)
                    sceneController.SetRevealPhase(phasePayload.phase);
                break;

            case "DEAL_DAMAGE":
                var damagePayload = JsonUtility.FromJson<DealDamagePayload>(json);
                if (sceneController != null)
                    sceneController.PlayDamageEffect(damagePayload.amount);
                break;

            default:
                Debug.LogWarning($"[WebBridge] Unknown event type: {msg.type}");
                break;
        }
    }

    public void SendSceneReady(string scene)
    {
        string json = JsonUtility.ToJson(new SceneReadyPayload { type = "SCENE_READY", scene = scene });
        SendToWeb(json);
    }

    public void SendAnimationDone(string animationType)
    {
        string json = JsonUtility.ToJson(new AnimationDonePayload { type = "ANIMATION_DONE", animationType = animationType });
        SendToWeb(json);
    }

    public void SendError(string code, string message)
    {
        string json = JsonUtility.ToJson(new ErrorPayload { type = "ERROR", code = code, message = message });
        SendToWeb(json);
    }

    public void SendLoadingProgress(float progress)
    {
        string json = JsonUtility.ToJson(new LoadingProgressPayload { type = "LOADING_PROGRESS", progress = progress });
        SendToWeb(json);
    }

    // --- Message Types ---

    [System.Serializable]
    private class BridgeMessage
    {
        public string type;
    }

    // Inbound payloads
    [System.Serializable]
    private class SetMoodPayload
    {
        public string type;
        public string vibe;
    }

    [System.Serializable]
    private class ChangeScenePayload
    {
        public string type;
        public int step;
    }

    [System.Serializable]
    private class SetBossPayload
    {
        public string type;
        public string id;
        public int hp;
    }

    [System.Serializable]
    private class SetPhasePayload
    {
        public string type;
        public string phase;
    }

    [System.Serializable]
    private class DealDamagePayload
    {
        public string type;
        public int amount;
    }

    // Outbound payloads
    [System.Serializable]
    private class LoadedPayload
    {
        public string type;
        public float buildSizeMB;
    }

    [System.Serializable]
    private class LoadingProgressPayload
    {
        public string type;
        public float progress;
    }

    [System.Serializable]
    private class SceneReadyPayload
    {
        public string type;
        public string scene;
    }

    [System.Serializable]
    private class AnimationDonePayload
    {
        public string type;
        public string animationType;
    }

    [System.Serializable]
    private class ErrorPayload
    {
        public string type;
        public string code;
        public string message;
    }
}
