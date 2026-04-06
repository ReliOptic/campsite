using System.Collections;
using UnityEngine;

/// <summary>
/// Orchestrates mood worlds, puzzle lifecycle, and cooldown transitions.
/// Mood world = persistent container. Puzzle spawns at anchor within active mood.
/// Cooldown scenes replace puzzle between levels.
/// </summary>
public class SceneController : MonoBehaviour
{
    [Header("Mood World Templates")]
    [SerializeField] private GameObject[] moodTemplates = new GameObject[5];

    [Header("Threshold Structure Template")]
    [SerializeField] private GameObject thresholdTemplate;

    // Explicit light reference — no more FindObjectsByType race condition
    private Light _directionalLight;

    // Mood state
    private GameObject _activeMoodWorld;
    private GameObject _activeThreshold;
    private string _currentVibe = "";
    private string _currentPhase = "";
    private Coroutine _moodTransition;

    // Puzzle state
    private PuzzleController _activePuzzle;
    private TelemetryCollector _telemetryCollector;
    private GameObject _puzzleAnchor;
    private int _currentPuzzleSeed;
    private int _puzzleIndex;

    // Cooldown state
    private GameObject _activeCooldown;
    private static readonly System.Func<GameObject>[] CooldownBuilders =
    {
        CooldownSceneBuilder.BuildWaterMemory,
        CooldownSceneBuilder.BuildLightGrowth,
        CooldownSceneBuilder.BuildSandTime,
    };

    private static readonly string[] VibeOrder = { "calm", "heavy", "restless", "drift", "agora" };

    // Puzzle anchor offset from mood world center
    private static readonly Vector3 PuzzleAnchorOffset = new(0f, 0f, 0f);

    public void Inject(GameObject[] moods, GameObject threshold)
    {
        moodTemplates = moods;
        thresholdTemplate = threshold;
    }

    /// <summary>
    /// Inject explicit light reference. Eliminates FindObjectsByType race condition.
    /// </summary>
    public void InjectLight(Light directional)
    {
        _directionalLight = directional;
    }

    // ─── Mood World ──────────────────────────────────────────────

    public void SetMood(string vibe)
    {
        if (string.IsNullOrEmpty(vibe) || vibe == _currentVibe) return;
        _currentVibe = vibe;

        int index = System.Array.IndexOf(VibeOrder, vibe.ToLower());
        if (index < 0 || index >= moodTemplates.Length)
        {
            Debug.LogWarning($"[SceneController] Unknown vibe: {vibe}");
            return;
        }

        GameObject template = moodTemplates[index];
        if (template == null)
        {
            Debug.Log($"[SceneController] moodTemplates[{index}] not assigned yet. Skipping swap.");
            return;
        }

        if (_moodTransition != null) StopCoroutine(_moodTransition);
        _moodTransition = StartCoroutine(SwapMoodWorld(template));
    }

    // ─── Puzzle Lifecycle ────────────────────────────────────────

    /// <summary>
    /// Step controls the scene phase:
    ///   0 = idle (mood world only)
    ///   1 = start puzzle
    ///   2 = show cooldown
    ///   3 = next puzzle
    /// </summary>
    public void SetStep(int step)
    {
        Debug.Log($"[SceneController] SetStep: {step}");

        switch (step)
        {
            case 0:
                TearDownPuzzle();
                TearDownCooldown();
                break;
            case 1:
                TearDownCooldown();
                SpawnPuzzle(_currentPuzzleSeed);
                break;
            case 2:
                TearDownPuzzle();
                SpawnCooldown();
                break;
            case 3:
                TearDownCooldown();
                _puzzleIndex++;
                _currentPuzzleSeed = _puzzleIndex * 7919; // deterministic seed per puzzle
                SpawnPuzzle(_currentPuzzleSeed);
                break;
        }
    }

    /// <summary>
    /// Start a puzzle with a specific seed. Called by SetStep or directly.
    /// </summary>
    public void StartPuzzle(int seed)
    {
        _currentPuzzleSeed = seed;
        TearDownCooldown();
        SpawnPuzzle(seed);
    }

    private void SpawnPuzzle(int seed)
    {
        TearDownPuzzle();

        // Create puzzle anchor as child of active mood world (or scene root)
        Transform parent = _activeMoodWorld != null
            ? _activeMoodWorld.transform
            : transform;

        _puzzleAnchor = new GameObject("PuzzleAnchor");
        _puzzleAnchor.transform.SetParent(parent);
        _puzzleAnchor.transform.localPosition = PuzzleAnchorOffset;

        // Create puzzle controller
        var puzzleGo = new GameObject("PuzzleSession");
        puzzleGo.transform.SetParent(_puzzleAnchor.transform);
        puzzleGo.transform.localPosition = Vector3.zero;

        _activePuzzle = puzzleGo.AddComponent<PuzzleController>();

        // Attach telemetry collector
        _telemetryCollector = puzzleGo.AddComponent<TelemetryCollector>();
        _telemetryCollector.Attach(_activePuzzle);

        // Listen for puzzle completion
        _activePuzzle.OnPuzzleSolved += HandlePuzzleSolved;

        _activePuzzle.StartPuzzle(seed);

        Debug.Log($"[SceneController] Puzzle spawned at anchor. Seed: {seed}");
    }

    private void HandlePuzzleSolved(float solveTime)
    {
        Debug.Log($"[SceneController] Puzzle solved in {solveTime:F1}s. Transitioning to cooldown.");

        // Brief delay, then show cooldown
        StartCoroutine(TransitionToCooldown(1.5f));
    }

    private IEnumerator TransitionToCooldown(float delay)
    {
        yield return new WaitForSeconds(delay);
        TearDownPuzzle();
        SpawnCooldown();

        if (WebBridge.Instance != null)
            WebBridge.Instance.SendSceneReady("cooldown");
    }

    private void SpawnCooldown()
    {
        TearDownCooldown();

        // Cycle through cooldown scenes
        int cooldownIndex = _puzzleIndex % CooldownBuilders.Length;
        _activeCooldown = CooldownBuilders[cooldownIndex]();

        Transform parent = _activeMoodWorld != null
            ? _activeMoodWorld.transform
            : transform;

        _activeCooldown.transform.SetParent(parent);
        _activeCooldown.transform.localPosition = PuzzleAnchorOffset;

        Debug.Log($"[SceneController] Cooldown scene {cooldownIndex} spawned.");
    }

    private void TearDownPuzzle()
    {
        if (_activePuzzle != null)
        {
            _activePuzzle.OnPuzzleSolved -= HandlePuzzleSolved;
            if (_telemetryCollector != null)
                _telemetryCollector.Detach();
            _activePuzzle.TearDown();
        }
        _activePuzzle = null;
        _telemetryCollector = null;

        if (_puzzleAnchor != null)
        {
            Destroy(_puzzleAnchor);
            _puzzleAnchor = null;
        }
    }

    private void TearDownCooldown()
    {
        if (_activeCooldown != null)
        {
            Destroy(_activeCooldown);
            _activeCooldown = null;
        }
    }

    // ─── Threshold ───────────────────────────────────────────────

    public void RevealThreshold(string id, int layers)
    {
        if (thresholdTemplate == null)
        {
            Debug.Log($"[SceneController] thresholdTemplate not assigned. id={id} layers={layers}");
            return;
        }

        if (_activeThreshold != null) Destroy(_activeThreshold);
        _activeThreshold = Instantiate(thresholdTemplate);
        _activeThreshold.SetActive(true);
        Debug.Log($"[SceneController] RevealThreshold: id={id} layers={layers}");
    }

    // ─── Phase Transitions ───────────────────────────────────────

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
            case "threshold":
                StartCoroutine(DimScene(1.0f, 0.5f));
                break;
            case "quest":
                if (_activeThreshold != null) StartCoroutine(FadeOutThreshold());
                StartCoroutine(DimScene(1.0f, 0.5f));
                break;
            case "complete":
                StartCoroutine(DimScene(1.0f, 1.0f));
                break;
        }

        if (WebBridge.Instance != null)
            WebBridge.Instance.SendSceneReady(phase);
    }

    public void PlayIlluminateEffect(int intensity)
    {
        Debug.Log($"[SceneController] PlayIlluminateEffect: {intensity}");
        StartCoroutine(PulseLight(0.3f, intensity * 0.05f));
    }

    // ─── Mood World Swap ─────────────────────────────────────────

    private IEnumerator SwapMoodWorld(GameObject template)
    {
        // Tear down any active puzzle/cooldown before swapping worlds
        TearDownPuzzle();
        TearDownCooldown();

        float duration = 1.5f;
        float elapsed = 0f;

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

        _activeMoodWorld = Instantiate(template);
        _activeMoodWorld.SetActive(true);
        elapsed = 0f;
        Renderer[] newRenderers = _activeMoodWorld.GetComponentsInChildren<Renderer>();

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

    // ─── Light Effects (explicit reference, no FindObjectsByType) ─

    private IEnumerator DimScene(float targetIntensity, float duration)
    {
        if (_directionalLight == null) yield break;

        float startIntensity = _directionalLight.intensity;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;
            _directionalLight.intensity = Mathf.Lerp(startIntensity, startIntensity * targetIntensity, t);
            yield return null;
        }
    }

    private IEnumerator FadeOutThreshold()
    {
        if (_activeThreshold == null) yield break;
        Renderer[] renderers = _activeThreshold.GetComponentsInChildren<Renderer>();
        float duration = 0.8f;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            SetRenderersAlpha(renderers, 1f - elapsed / duration);
            yield return null;
        }
        Destroy(_activeThreshold);
        _activeThreshold = null;
    }

    private IEnumerator PulseLight(float duration, float intensityBoost)
    {
        if (_directionalLight == null) yield break;

        float original = _directionalLight.intensity;

        float elapsed = 0f;
        while (elapsed < duration * 0.5f)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / (duration * 0.5f);
            _directionalLight.intensity = original + intensityBoost * t;
            yield return null;
        }

        elapsed = 0f;
        while (elapsed < duration * 0.5f)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / (duration * 0.5f);
            _directionalLight.intensity = original + intensityBoost * (1f - t);
            yield return null;
        }

        _directionalLight.intensity = original;
    }

    // ─── Helpers ─────────────────────────────────────────────────

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
