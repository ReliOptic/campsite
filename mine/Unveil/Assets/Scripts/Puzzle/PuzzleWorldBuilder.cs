using UnityEngine;

/// <summary>
/// Generates Escher-style 3x3 stair block puzzles for "계단의 기억" (Memory of Stairs).
/// Uses MeshBuilder for flat-shaded Monument Valley aesthetic.
/// Each block is a rotatable stair piece with edge connection heights.
/// Seeded random for deterministic puzzle generation.
/// </summary>
public class PuzzleWorldBuilder
{
    // ─── Block Templates ──────────────────────────────────────────
    // Edge heights: [N, E, S, W] — 0=ground, 1=mid, 2=top, -1=wall
    // Internal paths: pairs of connected edges (bidirectional)

    /// <summary>
    /// Straight stair: ground on one side, top on opposite, mid on sides.
    /// Internal path connects the two open ends.
    /// </summary>
    private static readonly int[] StraightEdges = { 0, -1, 2, -1 };
    private static readonly Vector2Int[] StraightPaths = { new(0, 2) };

    /// <summary>
    /// L-shaped stair: ground on N, top on E, walls elsewhere.
    /// Path turns 90 degrees.
    /// </summary>
    private static readonly int[] LShapeEdges = { 0, 2, -1, -1 };
    private static readonly Vector2Int[] LShapePaths = { new(0, 1) };

    /// <summary>
    /// T-junction: ground on N, mid on E and W, wall on S.
    /// Two internal paths branch from entry.
    /// </summary>
    private static readonly int[] TJunctionEdges = { 0, 1, -1, 1 };
    private static readonly Vector2Int[] TJunctionPaths = { new(0, 1), new(0, 3) };

    /// <summary>
    /// Platform: all sides at same height. Connector piece.
    /// All edges connected internally.
    /// </summary>
    private static readonly int[] PlatformEdges = { 1, 1, 1, 1 };
    private static readonly Vector2Int[] PlatformPaths = { new(0, 1), new(0, 2), new(0, 3), new(1, 2), new(1, 3), new(2, 3) };

    /// <summary>
    /// Bridge: connects N-S at mid height, walls on E-W.
    /// Single straight-through path.
    /// </summary>
    private static readonly int[] BridgeEdges = { 1, -1, 1, -1 };
    private static readonly Vector2Int[] BridgePaths = { new(0, 2) };

    /// <summary>
    /// Start piece: ground level exit on S, walls elsewhere.
    /// </summary>
    private static readonly int[] StartEdges = { -1, -1, 0, -1 };
    private static readonly Vector2Int[] StartPaths = { };

    /// <summary>
    /// Goal piece: ground level entry on N, walls elsewhere.
    /// </summary>
    private static readonly int[] GoalEdges = { 0, -1, -1, -1 };
    private static readonly Vector2Int[] GoalPaths = { };

    // All templates for random selection (excluding start/goal)
    private static readonly (int[] edges, Vector2Int[] paths)[] BlockTemplates =
    {
        (StraightEdges, StraightPaths),
        (LShapeEdges, LShapePaths),
        (TJunctionEdges, TJunctionPaths),
        (PlatformEdges, PlatformPaths),
        (BridgeEdges, BridgePaths),
    };

    // ─── Puzzle Generation ────────────────────────────────────────

    /// <summary>
    /// Build a complete puzzle on the grid with seeded block placement.
    /// Start cell (0,0) and goal cell (width-1, height-1) are fixed.
    /// Interior cells get random block types with random initial rotations.
    /// </summary>
    public void BuildPuzzle(IsometricGrid grid, int seed)
    {
        var rng = new System.Random(seed);
        int w = grid.Width;
        int h = grid.Height;

        for (int col = 0; col < w; col++)
        {
            for (int row = 0; row < h; row++)
            {
                int[] edges;
                Vector2Int[] paths;
                int initialRotation;

                if (col == 0 && row == 0)
                {
                    // Start cell — fixed orientation
                    edges = StartEdges;
                    paths = StartPaths;
                    initialRotation = 0;
                }
                else if (col == w - 1 && row == h - 1)
                {
                    // Goal cell — fixed orientation
                    edges = GoalEdges;
                    paths = GoalPaths;
                    initialRotation = 0;
                }
                else
                {
                    // Random block type
                    int templateIdx = rng.Next(BlockTemplates.Length);
                    var template = BlockTemplates[templateIdx];
                    edges = template.edges;
                    paths = template.paths;
                    // Random initial rotation (player must solve by rotating)
                    initialRotation = rng.Next(4);
                }

                // Create the block GameObject with visual geometry
                GameObject blockGo = BuildBlockVisual(col, row, edges, paths, rng);
                var block = blockGo.AddComponent<StairBlock>();
                block.Configure(edges, paths);

                // Apply initial rotation
                for (int r = 0; r < initialRotation; r++)
                {
                    // Direct rotation without animation for initial setup
                    block.SetRotationImmediate((block.Rotation + 1) % 4);
                }

                grid.PlaceBlock(col, row, block);
            }
        }

        // Add environmental framing
        BuildPuzzleFrame(grid);
    }

    // ─── Visual Geometry ──────────────────────────────────────────

    private GameObject BuildBlockVisual(int col, int row, int[] edges, Vector2Int[] paths, System.Random rng)
    {
        var root = new GameObject($"Block_{col}_{row}");

        // Base platform — every block has a flat base
        var basePlate = MeshBuilder.CreateFlatBox("BasePlate", 1.8f, 0.15f, 1.8f);
        basePlate.transform.SetParent(root.transform);
        basePlate.transform.localPosition = new Vector3(0f, -0.075f, 0f);
        SetBlockMaterial(basePlate, GetBaseColor(edges));

        // Build stair geometry based on edge heights
        BuildStairGeometry(root, edges, paths);

        // Connection indicators — small cylinders at edges showing height
        BuildEdgeIndicators(root, edges);

        return root;
    }

    private void BuildStairGeometry(GameObject root, int[] edges, Vector2Int[] paths)
    {
        // Count non-wall edges to determine block complexity
        int openEdges = 0;
        for (int i = 0; i < 4; i++)
            if (edges[i] >= 0) openEdges++;

        if (openEdges == 0)
        {
            // Closed block — tall wall
            var wall = MeshBuilder.CreateFlatBox("Wall", 1.6f, 1.2f, 1.6f);
            wall.transform.SetParent(root.transform);
            wall.transform.localPosition = new Vector3(0f, 0.6f, 0f);
            SetBlockMaterial(wall, new Color(0.35f, 0.30f, 0.40f));
            return;
        }

        // Build stair steps for each open edge
        for (int dir = 0; dir < 4; dir++)
        {
            if (edges[dir] < 0) continue;
            BuildStairSteps(root, dir, edges[dir]);
        }

        // Internal path connection — raised walkway between connected edges
        foreach (var path in paths)
        {
            BuildInternalWalkway(root, path.x, path.y, edges);
        }
    }

    private void BuildStairSteps(GameObject parent, int dir, int targetHeight)
    {
        int stepCount = Mathf.Max(1, targetHeight + 1);
        float stepWidth = 0.4f;
        float stepDepth = 0.3f;
        float stepHeightUnit = 0.25f;

        Vector3 dirVec = DirToVector(dir);
        Vector3 sideVec = new Vector3(-dirVec.z, 0f, dirVec.x); // perpendicular

        for (int s = 0; s < stepCount; s++)
        {
            float y = s * stepHeightUnit + 0.075f;
            float dist = 0.6f + s * stepDepth;

            var step = MeshBuilder.CreateFlatBox($"Step_{dir}_{s}", stepWidth, stepHeightUnit, stepDepth);
            step.transform.SetParent(parent.transform);
            step.transform.localPosition = dirVec * dist + Vector3.up * (y + stepHeightUnit * 0.5f);
            step.transform.localRotation = Quaternion.LookRotation(dirVec);

            // Gradient color: lighter at top
            float brightness = 0.55f + s * 0.1f;
            SetBlockMaterial(step, new Color(brightness, brightness * 0.95f, brightness * 1.05f));
        }
    }

    private void BuildInternalWalkway(GameObject parent, int fromDir, int toDir, int[] edges)
    {
        Vector3 from = DirToVector(fromDir) * 0.4f;
        Vector3 to = DirToVector(toDir) * 0.4f;

        float fromH = edges[fromDir] * 0.25f + 0.15f;
        float toH = edges[toDir] * 0.25f + 0.15f;
        float midH = Mathf.Max(fromH, toH) + 0.05f;

        // Walkway plank connecting two edges
        Vector3 midPoint = (from + to) * 0.5f + Vector3.up * midH;
        float length = Vector3.Distance(from, to);

        var walkway = MeshBuilder.CreateFlatBox("Walkway", 0.35f, 0.08f, length);
        walkway.transform.SetParent(parent.transform);
        walkway.transform.localPosition = midPoint;

        Vector3 lookDir = to - from;
        lookDir.y = 0f;
        if (lookDir.sqrMagnitude > 0.001f)
            walkway.transform.localRotation = Quaternion.LookRotation(lookDir);

        SetBlockMaterial(walkway, new Color(0.72f, 0.68f, 0.75f));
    }

    private void BuildEdgeIndicators(GameObject root, int[] edges)
    {
        for (int dir = 0; dir < 4; dir++)
        {
            if (edges[dir] < 0) continue;

            Vector3 dirVec = DirToVector(dir);
            float height = edges[dir] * 0.25f + 0.1f;

            var indicator = MeshBuilder.CreateFlatCylinder($"Edge_{dir}", 6, 0.06f, height);
            indicator.transform.SetParent(root.transform);
            indicator.transform.localPosition = dirVec * 0.9f + Vector3.up * (height * 0.5f);

            // Color by height: green=0, yellow=1, orange=2
            Color c = edges[dir] switch
            {
                0 => new Color(0.5f, 0.8f, 0.5f),
                1 => new Color(0.8f, 0.8f, 0.4f),
                2 => new Color(0.9f, 0.6f, 0.3f),
                _ => Color.gray
            };
            SetBlockMaterial(indicator, c);
        }
    }

    // ─── Puzzle Frame ─────────────────────────────────────────────

    private void BuildPuzzleFrame(IsometricGrid grid)
    {
        var frame = new GameObject("PuzzleFrame");

        // Start marker — glowing ground pad
        Vector3 startWorld = grid.GridToWorld(0, 0);
        var startPad = MeshBuilder.CreateFlatCylinder("StartPad", 6, 0.7f, 0.05f);
        startPad.transform.SetParent(frame.transform);
        startPad.transform.position = startWorld + Vector3.up * 0.01f;
        SetBlockMaterialUnlit(startPad, new Color(0.4f, 0.9f, 0.5f));

        // Goal marker — glowing elevated pad
        Vector3 goalWorld = grid.GridToWorld(grid.Width - 1, grid.Height - 1);
        var goalPad = MeshBuilder.CreateFlatCylinder("GoalPad", 6, 0.7f, 0.05f);
        goalPad.transform.SetParent(frame.transform);
        goalPad.transform.position = goalWorld + Vector3.up * 0.01f;
        SetBlockMaterialUnlit(goalPad, new Color(0.9f, 0.7f, 0.3f));
        goalPad.AddComponent<FloatBobber>().Configure(0.05f, 0.8f, 0f);

        // Ambient framing pillars at corners
        float margin = grid.CellSize * 0.8f;
        Vector3 center = grid.GridToWorld(grid.Width / 2, grid.Height / 2);
        float extentX = grid.Width * grid.CellSize * 0.5f + margin;
        float extentZ = grid.Height * grid.CellSize * 0.5f + margin;

        Vector3[] corners = {
            center + new Vector3(-extentX, 0, -extentZ),
            center + new Vector3( extentX, 0, -extentZ),
            center + new Vector3(-extentX, 0,  extentZ),
            center + new Vector3( extentX, 0,  extentZ),
        };

        for (int i = 0; i < corners.Length; i++)
        {
            float h = 3f + i * 0.5f;
            var pillar = MeshBuilder.CreateFlatCylinder($"FramePillar_{i}", 6, 0.15f, h);
            pillar.transform.SetParent(frame.transform);
            pillar.transform.position = corners[i] + Vector3.up * (h * 0.5f);
            SetBlockMaterial(pillar, new Color(0.45f, 0.40f, 0.55f, 0.6f));
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private static Vector3 DirToVector(int dir)
    {
        return dir switch
        {
            0 => Vector3.forward,  // North +Z
            1 => Vector3.right,    // East  +X
            2 => Vector3.back,     // South -Z
            3 => Vector3.left,     // West  -X
            _ => Vector3.zero
        };
    }

    private static Color GetBaseColor(int[] edges)
    {
        // Base color varies by block complexity
        int openCount = 0;
        for (int i = 0; i < edges.Length; i++)
            if (edges[i] >= 0) openCount++;

        return openCount switch
        {
            0 => new Color(0.30f, 0.25f, 0.35f),
            1 => new Color(0.50f, 0.48f, 0.55f),
            2 => new Color(0.60f, 0.58f, 0.65f),
            3 => new Color(0.65f, 0.63f, 0.70f),
            _ => new Color(0.70f, 0.68f, 0.75f),
        };
    }

    private static void SetBlockMaterial(GameObject go, Color color)
    {
        MaterialPool.ApplyToon(go, color);
    }

    private static void SetBlockMaterialUnlit(GameObject go, Color color)
    {
        MaterialPool.ApplyUnlit(go, color);
    }
}
