using System.Collections;
using UnityEngine;

/// <summary>
/// Orchestrates mood world prefab swaps and onboarding step transitions.
/// Attach to GameManager GameObject in AmbientSky scene.
/// SerializeField refs will be null until Phase 2 assigns them — all are null-checked.
/// </summary>
public class SceneController : MonoBehaviour
{
    [Header("Mood World Prefabs (assign in Phase 2)")]
    [SerializeField] private GameObject[] moodPrefabs = new GameObject[4]; // 0=calm, 1=heavy, 2=restless, 3=drift

    [Header("Boss Prefab (assign in Phase 2)")]
    [SerializeField] private GameObject bossOrbPrefab;

    public void Inject(GameObject[] moods, GameObject bossOrb)
    {
        moodPrefabs = moods;
        bossOrbPrefab = bossOrb;
    }

    private GameObject _activeMoodWorld;
    private GameObject _activeBossOrb;
    private string _currentVibe = "";
    private string _currentPhase = "";
    private Coroutine _moodTransition;

    private static readonly string[] VibeOrder = { "calm", "heavy", "restless", "drift" };

    public void SetMood(string vibe)
    {
        if (string.IsNullOrEmpty(vibe) || vibe == _currentVibe) return;
        _currentVibe = vibe;

        int index = System.Array.IndexOf(VibeOrder, vibe.ToLower());
        if (index < 0 || index >= moodPrefabs.Length)
        {
            Debug.LogWarning($"[SceneController] Unknown vibe: {vibe}");
            return;
        }

        GameObject prefab = moodPrefabs[index];
        if (prefab == null)
        {
            Debug.Log($"[SceneController] moodPrefabs[{index}] not assigned yet (Phase 2). Skipping swap.");
            return;
        }

        if (_moodTransition != null) StopCoroutine(_moodTransition);
        _moodTransition = StartCoroutine(SwapMoodWorld(prefab));
    }

    public void SetStep(int step)
    {
        Debug.Log($"[SceneController] SetStep: {step}");
    }

    public void ShowBoss(string id, int hp)
    {
        if (bossOrbPrefab == null)
        {
            Debug.Log($"[SceneController] bossOrbPrefab not assigned yet (Phase 2). Boss id={id} hp={hp}");
            return;
        }

        if (_activeBossOrb != null) Destroy(_activeBossOrb);
        _activeBossOrb = Instantiate(bossOrbPrefab);
        Debug.Log($"[SceneController] ShowBoss: id={id} hp={hp}");
    }

    public void SetRevealPhase(string phase)
    {
        if (string.IsNullOrEmpty(phase) || phase == _currentPhase) return;
        _currentPhase = phase;
        Debug.Log($"[SceneController] SetRevealPhase: {phase}");

        switch (phase)
        {
            case "loading":
                break;
            case "narrative":
                StartCoroutine(DimScene(0.4f, 0.8f));
                break;
            case "boss":
                StartCoroutine(DimScene(1.0f, 0.5f));
                break;
            case "quest":
                if (_activeBossOrb != null) StartCoroutine(FadeOutBoss());
                StartCoroutine(DimScene(1.0f, 0.5f));
                break;
            case "complete":
                StartCoroutine(DimScene(1.0f, 1.0f));
                break;
        }

        if (WebBridge.Instance != null)
            WebBridge.Instance.SendSceneReady(phase);
    }

    public void PlayDamageEffect(int amount)
    {
        Debug.Log($"[SceneController] PlayDamageEffect: {amount}");
        StartCoroutine(ShakeCamera(0.15f, 0.3f));
    }

    private IEnumerator SwapMoodWorld(GameObject prefab)
    {
        float duration = 1.5f;
        float elapsed = 0f;

        // Fade out existing world
        if (_activeMoodWorld != null)
        {
            Renderer[] renderers = _activeMoodWorld.GetComponentsInChildren<Renderer>();
            while (elapsed < duration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (duration * 0.5f);
                SetRenderersAlpha(renderers, 1f - t);
                yield return null;
            }
            Destroy(_activeMoodWorld);
        }

        _activeMoodWorld = Instantiate(prefab);
        elapsed = 0f;
        Renderer[] newRenderers = _activeMoodWorld.GetComponentsInChildren<Renderer>();

        // Fade in new world
        while (elapsed < duration * 0.5f)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / (duration * 0.5f);
            SetRenderersAlpha(newRenderers, t);
            yield return null;
        }

        SetRenderersAlpha(newRenderers, 1f);

        if (WebBridge.Instance != null)
            WebBridge.Instance.SendSceneReady(_currentVibe);

        _moodTransition = null;
    }

    private IEnumerator DimScene(float targetIntensity, float duration)
    {
        Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
        float[] startIntensities = new float[lights.Length];
        for (int i = 0; i < lights.Length; i++)
            startIntensities[i] = lights[i].intensity;

        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;
            for (int i = 0; i < lights.Length; i++)
                lights[i].intensity = Mathf.Lerp(startIntensities[i], startIntensities[i] * targetIntensity, t);
            yield return null;
        }
    }

    private IEnumerator FadeOutBoss()
    {
        if (_activeBossOrb == null) yield break;
        Renderer[] renderers = _activeBossOrb.GetComponentsInChildren<Renderer>();
        float duration = 0.8f;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            SetRenderersAlpha(renderers, 1f - elapsed / duration);
            yield return null;
        }
        Destroy(_activeBossOrb);
        _activeBossOrb = null;
    }

    private IEnumerator ShakeCamera(float magnitude, float duration)
    {
        Camera cam = Camera.main;
        if (cam == null) yield break;

        Vector3 originalPos = cam.transform.localPosition;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float x = Random.Range(-1f, 1f) * magnitude;
            float y = Random.Range(-1f, 1f) * magnitude;
            cam.transform.localPosition = new Vector3(originalPos.x + x, originalPos.y + y, originalPos.z);
            yield return null;
        }
        cam.transform.localPosition = originalPos;
    }

    private static void SetRenderersAlpha(Renderer[] renderers, float alpha)
    {
        foreach (Renderer r in renderers)
        {
            foreach (Material mat in r.materials)
            {
                if (mat.HasProperty("_Color"))
                {
                    Color c = mat.color;
                    c.a = alpha;
                    mat.color = c;
                }
            }
        }
    }
}
