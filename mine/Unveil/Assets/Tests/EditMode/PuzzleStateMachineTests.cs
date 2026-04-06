using System;
using NUnit.Framework;
using UnityEngine;

/// <summary>
/// EditMode tests for PuzzleStateMachine. Validates all valid transitions,
/// rejects all invalid transitions, and verifies event firing.
/// </summary>
[TestFixture]
public class PuzzleStateMachineTests
{
    private PuzzleStateMachine _sm;
    private LevelDefinition _level;

    [SetUp]
    public void SetUp()
    {
        _sm = new PuzzleStateMachine();
        _level = ScriptableObject.CreateInstance<LevelDefinition>();
        _level.levelId = "test_level";
        _level.seed = 42;
    }

    [TearDown]
    public void TearDown()
    {
        UnityEngine.Object.DestroyImmediate(_level);
    }

    // ─── Valid Transitions ───────────────────────────────────────

    [Test]
    public void StartsInIdle()
    {
        Assert.AreEqual(PuzzleStateMachine.State.Idle, _sm.Current);
    }

    [Test]
    public void Idle_To_Loading()
    {
        _sm.StartLevel(_level, 0);
        Assert.AreEqual(PuzzleStateMachine.State.Loading, _sm.Current);
    }

    [Test]
    public void Loading_To_Playing()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        Assert.AreEqual(PuzzleStateMachine.State.Playing, _sm.Current);
    }

    [Test]
    public void Playing_To_Solved()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Solve();
        Assert.AreEqual(PuzzleStateMachine.State.Solved, _sm.Current);
    }

    [Test]
    public void Solved_To_Cooldown()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Solve();
        _sm.BeginCooldown();
        Assert.AreEqual(PuzzleStateMachine.State.Cooldown, _sm.Current);
    }

    [Test]
    public void Cooldown_To_Loading_NextLevel()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Solve();
        _sm.BeginCooldown();

        var nextLevel = ScriptableObject.CreateInstance<LevelDefinition>();
        nextLevel.levelId = "test_level_2";
        _sm.NextLevel(nextLevel);

        Assert.AreEqual(PuzzleStateMachine.State.Loading, _sm.Current);
        Assert.AreEqual(nextLevel, _sm.CurrentLevel);
        Assert.AreEqual(1, _sm.LevelIndex);

        UnityEngine.Object.DestroyImmediate(nextLevel);
    }

    [Test]
    public void FullCycle_Idle_Through_Cooldown_Back_To_Idle()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Solve();
        _sm.BeginCooldown();
        _sm.Reset();

        Assert.AreEqual(PuzzleStateMachine.State.Idle, _sm.Current);
        Assert.IsNull(_sm.CurrentLevel);
    }

    // ─── Reset from any state ────────────────────────────────────

    [Test]
    public void Reset_From_Loading()
    {
        _sm.StartLevel(_level, 0);
        _sm.Reset();
        Assert.AreEqual(PuzzleStateMachine.State.Idle, _sm.Current);
    }

    [Test]
    public void Reset_From_Playing()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Reset();
        Assert.AreEqual(PuzzleStateMachine.State.Idle, _sm.Current);
    }

    [Test]
    public void Reset_From_Solved()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Solve();
        _sm.Reset();
        Assert.AreEqual(PuzzleStateMachine.State.Idle, _sm.Current);
    }

    // ─── Invalid Transitions ─────────────────────────────────────

    [Test]
    public void Idle_To_Playing_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => _sm.BeginPlaying());
    }

    [Test]
    public void Idle_To_Solved_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => _sm.Solve());
    }

    [Test]
    public void Idle_To_Cooldown_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => _sm.BeginCooldown());
    }

    [Test]
    public void Loading_To_Solved_Throws()
    {
        _sm.StartLevel(_level, 0);
        Assert.Throws<InvalidOperationException>(() => _sm.Solve());
    }

    [Test]
    public void Playing_To_Cooldown_Throws()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        Assert.Throws<InvalidOperationException>(() => _sm.BeginCooldown());
    }

    [Test]
    public void Solved_To_Playing_Throws()
    {
        _sm.StartLevel(_level, 0);
        _sm.BeginPlaying();
        _sm.Solve();
        Assert.Throws<InvalidOperationException>(() => _sm.BeginPlaying());
    }

    // ─── Event Firing ────────────────────────────────────────────

    [Test]
    public void OnTransition_Fires_With_Correct_States()
    {
        PuzzleStateMachine.State capturedFrom = PuzzleStateMachine.State.Idle;
        PuzzleStateMachine.State capturedTo = PuzzleStateMachine.State.Idle;
        int fireCount = 0;

        _sm.OnTransition += (from, to) =>
        {
            capturedFrom = from;
            capturedTo = to;
            fireCount++;
        };

        _sm.StartLevel(_level, 0);

        Assert.AreEqual(1, fireCount);
        Assert.AreEqual(PuzzleStateMachine.State.Idle, capturedFrom);
        Assert.AreEqual(PuzzleStateMachine.State.Loading, capturedTo);
    }

    // ─── IsValidTransition static check ──────────────────────────

    [Test]
    public void IsValidTransition_Returns_True_For_Valid()
    {
        Assert.IsTrue(PuzzleStateMachine.IsValidTransition(
            PuzzleStateMachine.State.Idle, PuzzleStateMachine.State.Loading));
        Assert.IsTrue(PuzzleStateMachine.IsValidTransition(
            PuzzleStateMachine.State.Playing, PuzzleStateMachine.State.Solved));
    }

    [Test]
    public void IsValidTransition_Returns_False_For_Invalid()
    {
        Assert.IsFalse(PuzzleStateMachine.IsValidTransition(
            PuzzleStateMachine.State.Idle, PuzzleStateMachine.State.Solved));
        Assert.IsFalse(PuzzleStateMachine.IsValidTransition(
            PuzzleStateMachine.State.Cooldown, PuzzleStateMachine.State.Solved));
    }

    // ─── LevelDefinition ─────────────────────────────────────────

    [Test]
    public void LevelDefinition_StarRating_ThreeStars()
    {
        _level.threeStarRotations = 6;
        _level.twoStarRotations = 12;
        Assert.AreEqual(3, _level.GetStarRating(4));
        Assert.AreEqual(3, _level.GetStarRating(6));
    }

    [Test]
    public void LevelDefinition_StarRating_TwoStars()
    {
        _level.threeStarRotations = 6;
        _level.twoStarRotations = 12;
        Assert.AreEqual(2, _level.GetStarRating(7));
        Assert.AreEqual(2, _level.GetStarRating(12));
    }

    [Test]
    public void LevelDefinition_StarRating_OneStar()
    {
        _level.threeStarRotations = 6;
        _level.twoStarRotations = 12;
        Assert.AreEqual(1, _level.GetStarRating(13));
        Assert.AreEqual(1, _level.GetStarRating(100));
    }

    // ─── CurrentLevel tracking ───────────────────────────────────

    [Test]
    public void StartLevel_Sets_CurrentLevel_And_Index()
    {
        _sm.StartLevel(_level, 3);
        Assert.AreEqual(_level, _sm.CurrentLevel);
        Assert.AreEqual(3, _sm.LevelIndex);
    }

    [Test]
    public void Reset_Clears_CurrentLevel()
    {
        _sm.StartLevel(_level, 0);
        _sm.Reset();
        Assert.IsNull(_sm.CurrentLevel);
        Assert.AreEqual(0, _sm.LevelIndex);
    }
}
