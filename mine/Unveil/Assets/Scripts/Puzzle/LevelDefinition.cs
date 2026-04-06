using UnityEngine;

/// <summary>
/// ScriptableObject defining a single puzzle level's parameters.
/// Decouples level data from game logic. Create via Assets > Create > Unveil > Level Definition.
///
/// BDM-3 tags indicate which personality dimensions this level is designed to measure:
///   D1 = Cognitive Persistence (patience, retry behavior)
///   D2 = Exploratory Curiosity (path variety, rotation diversity)
///   D3 = Frustration Tolerance (backtrack recovery, hesitation patterns)
/// </summary>
[CreateAssetMenu(fileName = "Level_01", menuName = "Unveil/Level Definition")]
public class LevelDefinition : ScriptableObject
{
    [Header("Identity")]
    [Tooltip("Unique identifier for this level")]
    public string levelId = "memory_of_stairs_01";

    [Tooltip("Display name (Korean)")]
    public string displayName = "계단의 기억";

    [Tooltip("Puzzle generation seed. Same seed = same puzzle layout")]
    public int seed = 42;

    [Header("Grid")]
    [Range(2, 5)] public int gridWidth = 3;
    [Range(2, 5)] public int gridHeight = 3;
    public float cellSize = 2.0f;

    [Header("Endpoints")]
    public Vector2Int startCell = Vector2Int.zero;
    public Vector2Int goalCell = new Vector2Int(2, 2);

    [Header("Mood Association")]
    [Tooltip("Which mood world this puzzle appears in")]
    public string moodVibe = "calm";

    [Header("Difficulty")]
    [Range(1, 10)] public int difficulty = 1;

    [Tooltip("Maximum rotations for 3-star rating")]
    public int threeStarRotations = 6;

    [Tooltip("Maximum rotations for 2-star rating")]
    public int twoStarRotations = 12;

    [Header("BDM-3 Measurement Tags")]
    [Tooltip("Weight for D1: Cognitive Persistence (0 = not measured)")]
    [Range(0f, 1f)] public float d1Weight = 0.5f;

    [Tooltip("Weight for D2: Exploratory Curiosity")]
    [Range(0f, 1f)] public float d2Weight = 0.3f;

    [Tooltip("Weight for D3: Frustration Tolerance")]
    [Range(0f, 1f)] public float d3Weight = 0.2f;

    [Header("Sequence")]
    [Tooltip("Which cooldown scene plays after this level (0=Water, 1=Light, 2=Sand)")]
    [Range(0, 2)] public int cooldownIndex;

    [Tooltip("Next level to load after cooldown. Null = session end")]
    public LevelDefinition nextLevel;

    /// <summary>
    /// Rate player performance by rotation count.
    /// </summary>
    public int GetStarRating(int rotations)
    {
        if (rotations <= threeStarRotations) return 3;
        if (rotations <= twoStarRotations) return 2;
        return 1;
    }
}
