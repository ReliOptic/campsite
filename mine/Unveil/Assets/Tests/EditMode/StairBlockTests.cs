using NUnit.Framework;
using UnityEngine;

[TestFixture]
public class StairBlockTests
{
    private GameObject _go;
    private StairBlock _block;

    [SetUp]
    public void SetUp()
    {
        _go = new GameObject("TestBlock");
        _block = _go.AddComponent<StairBlock>();
    }

    [TearDown]
    public void TearDown()
    {
        Object.DestroyImmediate(_go);
    }

    // ─── Edge Heights ────────────────────────────────────────────

    [Test]
    public void GetEdgeHeight_NoRotation_ReturnsOriginal()
    {
        // N=0, E=1, S=2, W=-1
        _block.Configure(new[] { 0, 1, 2, -1 }, new Vector2Int[0]);

        Assert.AreEqual(0, _block.GetEdgeHeight(0));  // N
        Assert.AreEqual(1, _block.GetEdgeHeight(1));  // E
        Assert.AreEqual(2, _block.GetEdgeHeight(2));  // S
        Assert.AreEqual(-1, _block.GetEdgeHeight(3)); // W
    }

    [Test]
    public void GetEdgeHeight_OneRotation_ShiftsCW()
    {
        // Original: N=0, E=1, S=2, W=3
        // After 1 CW rotation: N=W(3), E=N(0), S=E(1), W=S(2)
        _block.Configure(new[] { 0, 1, 2, 3 }, new Vector2Int[0]);
        _block.SetRotationImmediate(1);

        Assert.AreEqual(3, _block.GetEdgeHeight(0));  // N was W
        Assert.AreEqual(0, _block.GetEdgeHeight(1));  // E was N
        Assert.AreEqual(1, _block.GetEdgeHeight(2));  // S was E
        Assert.AreEqual(2, _block.GetEdgeHeight(3));  // W was S
    }

    [Test]
    public void GetEdgeHeight_FullRotation_ReturnsOriginal()
    {
        _block.Configure(new[] { 0, 1, 2, -1 }, new Vector2Int[0]);
        _block.SetRotationImmediate(4);

        Assert.AreEqual(0, _block.GetEdgeHeight(0));
        Assert.AreEqual(1, _block.GetEdgeHeight(1));
        Assert.AreEqual(2, _block.GetEdgeHeight(2));
        Assert.AreEqual(-1, _block.GetEdgeHeight(3));
    }

    // ─── Internal Paths ──────────────────���───────────────────────

    [Test]
    public void HasInternalPath_Exists_ReturnsTrue()
    {
        _block.Configure(new[] { 0, 2, -1, -1 }, new[] { new Vector2Int(0, 1) });

        Assert.IsTrue(_block.HasInternalPath(0, 1));  // N→E
        Assert.IsTrue(_block.HasInternalPath(1, 0));  // E→N (bidirectional)
    }

    [Test]
    public void HasInternalPath_NotExists_ReturnsFalse()
    {
        _block.Configure(new[] { 0, 2, -1, -1 }, new[] { new Vector2Int(0, 1) });

        Assert.IsFalse(_block.HasInternalPath(0, 2));  // N→S not connected
        Assert.IsFalse(_block.HasInternalPath(2, 3));  // S→W not connected
    }

    [Test]
    public void HasInternalPath_WithRotation_ShiftsDirections()
    {
        // Path from N(0) to E(1). After 1 CW rotation, path is from E(1) to S(2).
        _block.Configure(new[] { 0, 2, -1, -1 }, new[] { new Vector2Int(0, 1) });
        _block.SetRotationImmediate(1);

        Assert.IsTrue(_block.HasInternalPath(1, 2));   // Rotated: E→S
        Assert.IsFalse(_block.HasInternalPath(0, 1));  // N→E no longer valid
    }

    // ─── CanConnect ──────────────────���───────────────────────���───

    [Test]
    public void CanConnect_MatchingHeights_ReturnsTrue()
    {
        var goA = new GameObject("A");
        var goB = new GameObject("B");
        var a = goA.AddComponent<StairBlock>();
        var b = goB.AddComponent<StairBlock>();

        a.Configure(new[] { -1, 1, -1, -1 }, new Vector2Int[0]);  // E=1
        b.Configure(new[] { -1, -1, -1, 1 }, new Vector2Int[0]);  // W=1

        Assert.IsTrue(StairBlock.CanConnect(a, 1, b));  // A's East connects to B's West

        Object.DestroyImmediate(goA);
        Object.DestroyImmediate(goB);
    }

    [Test]
    public void CanConnect_MismatchedHeights_ReturnsFalse()
    {
        var goA = new GameObject("A");
        var goB = new GameObject("B");
        var a = goA.AddComponent<StairBlock>();
        var b = goB.AddComponent<StairBlock>();

        a.Configure(new[] { -1, 1, -1, -1 }, new Vector2Int[0]);  // E=1
        b.Configure(new[] { -1, -1, -1, 2 }, new Vector2Int[0]);  // W=2

        Assert.IsFalse(StairBlock.CanConnect(a, 1, b));

        Object.DestroyImmediate(goA);
        Object.DestroyImmediate(goB);
    }

    [Test]
    public void CanConnect_WallEdge_ReturnsFalse()
    {
        var goA = new GameObject("A");
        var goB = new GameObject("B");
        var a = goA.AddComponent<StairBlock>();
        var b = goB.AddComponent<StairBlock>();

        a.Configure(new[] { -1, -1, -1, -1 }, new Vector2Int[0]);  // All walls
        b.Configure(new[] { -1, -1, -1, 1 }, new Vector2Int[0]);

        Assert.IsFalse(StairBlock.CanConnect(a, 1, b));

        Object.DestroyImmediate(goA);
        Object.DestroyImmediate(goB);
    }
}
