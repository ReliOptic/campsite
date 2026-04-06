using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Manages puzzle session lifecycle with explicit state transitions.
/// States: Idle → Loading → Playing → Solved → Cooldown → Idle (or next level).
/// Invalid transitions throw, making state bugs fail-fast in tests.
/// </summary>
public class PuzzleStateMachine
{
    public enum State
    {
        Idle,       // No puzzle active, mood world visible
        Loading,    // Building puzzle geometry
        Playing,    // Player interacting with puzzle
        Solved,     // Path found, walker animating
        Cooldown,   // Between-puzzle contemplative scene
    }

    public State Current { get; private set; } = State.Idle;

    public event Action<State, State> OnTransition;  // (from, to)

    private LevelDefinition _currentLevel;
    private int _levelIndex;
    private float _stateEnteredTime;

    public LevelDefinition CurrentLevel => _currentLevel;
    public int LevelIndex => _levelIndex;
    public float TimeInState => Time.time - _stateEnteredTime;

    // ─── Allowed Transitions ─────────────────────────────────────

    private static readonly Dictionary<State, HashSet<State>> AllowedTransitions = new()
    {
        { State.Idle,     new HashSet<State> { State.Loading } },
        { State.Loading,  new HashSet<State> { State.Playing, State.Idle } },
        { State.Playing,  new HashSet<State> { State.Solved, State.Idle } },
        { State.Solved,   new HashSet<State> { State.Cooldown, State.Idle } },
        { State.Cooldown, new HashSet<State> { State.Loading, State.Idle } },
    };

    // ─── Transition Methods ──────────────────────────────────────

    /// <summary>
    /// Begin loading a level. Transitions Idle → Loading.
    /// </summary>
    public void StartLevel(LevelDefinition level, int index)
    {
        TransitionTo(State.Loading);
        _currentLevel = level;
        _levelIndex = index;
    }

    /// <summary>
    /// Puzzle is built and ready for interaction. Loading → Playing.
    /// </summary>
    public void BeginPlaying()
    {
        TransitionTo(State.Playing);
    }

    /// <summary>
    /// Player solved the puzzle. Playing → Solved.
    /// </summary>
    public void Solve()
    {
        TransitionTo(State.Solved);
    }

    /// <summary>
    /// Walker finished, show cooldown. Solved → Cooldown.
    /// </summary>
    public void BeginCooldown()
    {
        TransitionTo(State.Cooldown);
    }

    /// <summary>
    /// Cooldown complete, load next level. Cooldown → Loading.
    /// </summary>
    public void NextLevel(LevelDefinition level)
    {
        TransitionTo(State.Loading);
        _currentLevel = level;
        _levelIndex++;
    }

    /// <summary>
    /// Return to idle from any state (session end, abort, error recovery).
    /// </summary>
    public void Reset()
    {
        TransitionTo(State.Idle);
        _currentLevel = null;
        _levelIndex = 0;
    }

    // ─── Core ────────────────────────────────────────────────────

    private void TransitionTo(State next)
    {
        if (!IsValidTransition(Current, next))
        {
            throw new InvalidOperationException(
                $"[PuzzleStateMachine] Invalid transition: {Current} → {next}");
        }

        State prev = Current;
        Current = next;
        _stateEnteredTime = Time.time;

        Debug.Log($"[PuzzleStateMachine] {prev} → {next}");
        OnTransition?.Invoke(prev, next);
    }

    /// <summary>
    /// Check if a transition is allowed without performing it.
    /// </summary>
    public static bool IsValidTransition(State from, State to)
    {
        return AllowedTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to);
    }
}
