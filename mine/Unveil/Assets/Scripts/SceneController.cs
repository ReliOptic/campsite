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

    // Puzzle state machine
    private readonly PuzzleStateMachine _stateMachine = new();
    private PuzzleController _activePuzzle;
    private TelemetryCollector _telemetryCollector;
    private GameObject _puzzleAnchor;

    // Level sequence (assign via InjectLevels or load from Resources)
    private LevelDefinition[] _levels;
    private int _levelIndex;

    // Cooldown state
    private GameObject _activeCooldown;
    private static readonly System.Func<GameObject>[] CooldownBuilders =
    {
        CooldownSceneBuilder.BuildWaterMemory,
        CooldownSceneBuilder.BuildLightGrowth,
        CooldownSceneBuilder.BuildSandTime,
    };

    public PuzzleStateMachine StateMachine => _stateMachine;

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

    /// <summary>
    /// Inject level sequence for the session.
    /// </summary>
    public void InjectLevels(LevelDefinition[] levels)
    {
        _levels = levels;
        _levelIndex = 0;
    }

    // ─── Puzzle Lifecycle (state machine driven) ─────────────────

    /// <summary>
    /// WebBridge compat. Step: 0=idle, 1=start level, 2=cooldown, 3=next level.
    /// </summary>
    public void SetStep(int step)
    {
        Debug.Log($"[SceneController] SetStep: {step} (state: {_stateMachine.Current})");

        switch (step)
        {
            case 0:
                ReturnToIdle();
                break;
            case 1:
                StartCurrentLevel();
                break;
            case 2:
                // Guard: cooldown requires Solved state. If still Playing, solve first.
                if (_stateMachine.Current == PuzzleStateMachine.State.Playing)
                    _stateMachine.Solve();
                BeginCooldown();
                break;
            case 3:
                AdvanceToNextLevel();
                break;
        }
    }

    /// <summary>
    /// Start a puzzle with a specific seed (no LevelDefinition). Bridge compat.
    /// </summary>
    public void StartPuzzle(int seed)
    {
        // Create an ad-hoc level definition for seed-only starts
        var adhoc = ScriptableObject.CreateInstance<LevelDefinition>();
        adhoc.seed = seed;
        adhoc.levelId = $"adhoc_{seed}";
        adhoc.gridWidth = 3;
        adhoc.gridHeight = 3;
        adhoc.cellSize = 2.0f;
        adhoc.startCell = Vector2Int.zero;
        adhoc.goalCell = new Vector2Int(2, 2);
        adhoc.moodVibe = _currentVibe;

        if (_stateMachine.Current != PuzzleStateMachine.State.Idle)
            _stateMachine.Reset();

        _stateMachine.StartLevel(adhoc, _levelIndex);
        SpawnPuzzleFromLevel(adhoc);
    }

    /// <summary>
    /// Start the current level from the injected sequence.
    /// </summary>
    public void StartCurrentLevel()
    {
        if (_levels == null || _levels.Length == 0)
        {
            Debug.LogWarning("[SceneController] No levels injected. Use InjectLevels() first.");
            return;
        }

        if (_levelIndex >= _levels.Length)
        {
            Debug.Log("[SceneController] All levels complete.");
            ReturnToIdle();
            return;
        }

        TearDownCooldown();
        var level = _levels[_levelIndex];

        if (_stateMachine.Current != PuzzleStateMachine.State.Idle)
            _stateMachine.Reset();

        _stateMachine.StartLevel(level, _levelIndex);
        SpawnPuzzleFromLevel(level);
    }

    private void SpawnPuzzleFromLevel(LevelDefinition level)
    {
        TearDownPuzzle();

        // Set mood if level specifies one
        if (!string.IsNullOrEmpty(level.moodVibe) && level.moodVibe != _currentVibe)
            SetMood(level.moodVibe);

        Transform parent = _activeMoodWorld != null
            ? _activeMoodWorld.transform
            : transform;

        _puzzleAnchor = new GameObject("PuzzleAnchor");
        _puzzleAnchor.transform.SetParent(parent);
        _puzzleAnchor.transform.localPosition = PuzzleAnchorOffset;

        var puzzleGo = new GameObject("PuzzleSession");
        puzzleGo.transform.SetParent(_puzzleAnchor.transform);
        puzzleGo.transform.localPosition = Vector3.zero;

        _activePuzzle = puzzleGo.AddComponent<PuzzleController>();
        _activePuzzle.Configure(level.gridWidth, level.gridHeight, level.cellSize, level.startCell, level.goalCell);

        _telemetryCollector = puzzleGo.AddComponent<TelemetryCollector>();
        _telemetryCollector.Attach(_activePuzzle);

        _activePuzzle.OnPuzzleSolved += HandlePuzzleSolved;
        _activePuzzle.StartPuzzle(level.seed);

        _stateMachine.BeginPlaying();
        Debug.Log($"[SceneController] Level '{level.levelId}' spawned. Seed: {level.seed}");
    }

    private void HandlePuzzleSolved(float solveTime)
    {
        _stateMachine.Solve();

        int stars = _stateMachine.CurrentLevel != null
            ? _stateMachine.CurrentLevel.GetStarRating(_activePuzzle.RotationCount)
            : 0;

        Debug.Log($"[SceneController] Puzzle solved in {solveTime:F1}s. Stars: {stars}. Transitioning to cooldown.");
        StartCoroutine(TransitionToCooldown(1.5f));
    }

    private IEnumerator TransitionToCooldown(float delay)
    {
        yield return new WaitForSeconds(delay);
        TearDownPuzzle();
        BeginCooldown();
    }

    private void BeginCooldown()
    {
        _stateMachine.BeginCooldown();
        SpawnCooldown();

        if (WebBridge.Instance != null)
            WebBridge.Instance.SendSceneReady("cooldown");
    }

    private void SpawnCooldown()
    {
        TearDownCooldown();

        int cooldownIndex = _stateMachine.CurrentLevel != null
            ? _stateMachine.CurrentLevel.cooldownIndex
            : _levelIndex % CooldownBuilders.Length;

        _activeCooldown = CooldownBuilders[cooldownIndex]();

        Transform parent = _activeMoodWorld != null
            ? _activeMoodWorld.transform
            : transform;

        _activeCooldown.transform.SetParent(parent);
        _activeCooldown.transform.localPosition = PuzzleAnchorOffset;

        Debug.Log($"[SceneController] Cooldown scene {cooldownIndex} spawned.");
    }

    private void AdvanceToNextLevel()
    {
        TearDownCooldown();
        _levelIndex++;

        if (_levels != null && _levelIndex < _levels.Length)
        {
            var next = _levels[_levelIndex];
            _stateMachine.NextLevel(next);
            SpawnPuzzleFromLevel(next);
        }
        else
        {
            Debug.Log("[SceneController] Session complete. Returning to idle.");
            ReturnToIdle();
        }
    }

    private void ReturnToIdle()
    {
        TearDownPuzzle();
        TearDownCooldown();
        if (_stateMachine.Current != PuzzleStateMachine.State.Idle)
            _stateMachine.Reset();
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
