using NUnit.Framework;
using UnityEngine;

[TestFixture]
public class PathValidatorTests
{
    private GameObject _gridGo;
    private IsometricGrid _grid;

    [SetUp]
    public void SetUp()
    {
        _gridGo = new GameObject("TestGrid");
        _grid = _gridGo.AddComponent<IsometricGrid>();
        _grid.Initialize(3, 3, 2.0f);
    }

    [TearDown]
    public void TearDown()
    {
        Object.DestroyImmediate(_gridGo);
    }

    private StairBlock PlaceBlock(int col, int row, int[] edges, Vector2Int[] paths, int rotation = 0)
    {
        var go = new GameObject($"Block_{col}_{row}");
        go.transform.SetParent(_gridGo.transform);
        var block = go.AddComponent<StairBlock>();
        block.Configure(edges, paths);
        if (rotation > 0) block.SetRotationImmediate(rotation);
        _grid.PlaceBlock(col, row, block);
        return block;
    }

    // ─── Start/Goal Special Case ─────────────────────────────────

    [Test]
    public void StartBlock_WithEmptyPaths_CanExitToNeighbor()
    {
        // Start block: only S edge open, no internal paths (like the real StartEdges)
        PlaceBlock(0, 0, new[] { -1, -1, 0, -1 }, new Vector2Int[0]);

        // Middle block: connects N↔S at height 0
        PlaceBlock(0, 1, new[] { 0, -1, 0, -1 }, new[] { new Vector2Int(0, 2) });

        // Goal block: only N edge open, no internal paths
        PlaceBlock(0, 2, new[] { 0, -1, -1, -1 }, new Vector2Int[0]);

        // This is a 1-column path: start(0,0) → mid(0,1) → goal(0,2)
        // Previously failed because BFS couldn't exit start block
        var result = PathValidator.FindPath(_grid, new Vector2Int(0, 0), new Vector2Int(0, 2));
        Assert.IsTrue(result.IsValid, "Path should be valid with start/goal special case");
        Assert.AreEqual(3, result.Nodes.Count);
    }

    [Test]
    public void EmptyPaths_StartBlock_Previously_Unsolvable()
    {
        // Reproduce the exact bug: start at (0,0), goal at (2,2), 3x3 grid
        // Start has empty paths, goal has empty paths
        int[] startEdges = { -1, -1, 0, -1 };
        int[] goalEdges = { 0, -1, -1, -1 };
        int[] straightEdges = { 0, -1, 0, -1 };
        var straightPaths = new[] { new Vector2Int(0, 2) };

        // Build a straight vertical path: (0,0)→(0,1)→(0,2) and horizontal at (1,2)→(2,2)
        PlaceBlock(0, 0, startEdges, new Vector2Int[0]);
        PlaceBlock(0, 1, new[] { 0, 0, 0, -1 }, new[] { new Vector2Int(0, 1), new Vector2Int(0, 2) });
        PlaceBlock(0, 2, new[] { 0, 0, -1, -1 }, new[] { new Vector2Int(0, 1) });
        PlaceBlock(1, 2, new[] { -1, 0, -1, 0 }, new[] { new Vector2Int(1, 3) });
        PlaceBlock(2, 2, goalEdges, new Vector2Int[0]);

        // Fill remaining cells with walls
        PlaceBlock(1, 0, new[] { -1, -1, -1, -1 }, new Vector2Int[0]);
        PlaceBlock(2, 0, new[] { -1, -1, -1, -1 }, new Vector2Int[0]);
        PlaceBlock(1, 1, new[] { -1, -1, -1, -1 }, new Vector2Int[0]);
        PlaceBlock(2, 1, new[] { -1, -1, -1, -1 }, new Vector2Int[0]);

        var result = PathValidator.FindPath(_grid, new Vector2Int(0, 0), new Vector2Int(2, 2));
        Assert.IsTrue(result.IsValid, "Bug fix: start block with empty paths should still allow BFS exit");
    }

    // ─── No Path ──��──────────────────────────────────────────────

    [Test]
    public void NoPath_AllWalls_ReturnsFalse()
    {
        for (int c = 0; c < 3; c++)
            for (int r = 0; r < 3; r++)
                PlaceBlock(c, r, new[] { -1, -1, -1, -1 }, new Vector2Int[0]);

        var result = PathValidator.FindPath(_grid, Vector2Int.zero, new Vector2Int(2, 2));
        Assert.IsFalse(result.IsValid);
    }

    [Test]
    public void NoPath_DisconnectedHeights_ReturnsFalse()
    {
        // Start exits at height 0, but neighbor expects height 2
        PlaceBlock(0, 0, new[] { -1, -1, 0, -1 }, new Vector2Int[0]);
        PlaceBlock(0, 1, new[] { 2, -1, -1, -1 }, new Vector2Int[0]);  // N=2, doesn't match S=0

        var result = PathValidator.FindPath(_grid, Vector2Int.zero, new Vector2Int(0, 1));
        Assert.IsFalse(result.IsValid);
    }

    // ─── Grid Coordinate Roundtrip ───────────────────────────────

    [Test]
    public void IsometricGrid_WorldToGrid_Roundtrip()
    {
        for (int c = 0; c < 3; c++)
        {
            for (int r = 0; r < 3; r++)
            {
                Vector3 world = _grid.GridToWorld(c, r);
                Vector2Int grid = _grid.WorldToGrid(world);
                Assert.AreEqual(new Vector2Int(c, r), grid, $"Roundtrip failed for ({c},{r})");
            }
        }
    }

    [Test]
    public void IsometricGrid_OutOfBounds_ReturnsNegative()
    {
        Vector2Int oob = _grid.WorldToGrid(new Vector3(100f, 0f, 100f));
        Assert.AreEqual(new Vector2Int(-1, -1), oob);
    }
}
