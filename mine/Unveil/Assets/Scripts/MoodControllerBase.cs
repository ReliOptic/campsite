using System.Collections;
using UnityEngine;

/// <summary>
/// Abstract base for mood-reactive controllers (lighting, particles, etc.).
/// Handles vibe dedup, preset lookup, and coroutine lifecycle.
/// Subclasses define preset type T and implement the transition.
/// </summary>
public abstract class MoodControllerBase<T> : MonoBehaviour where T : struct
{
    private Coroutine _transition;
    private string _currentVibe = "";

    [SerializeField] protected float transitionDuration = 1.0f;

    public string CurrentVibe => _currentVibe;

    public void SetMood(string vibe)
    {
        if (string.IsNullOrEmpty(vibe) || vibe == _currentVibe) return;
        _currentVibe = vibe;

        T? target = GetPreset(vibe);
        if (target == null)
        {
            Debug.LogWarning($"[{GetType().Name}] Unknown vibe: {vibe}");
            return;
        }

        if (!IsReady())
        {
            Debug.Log($"[{GetType().Name}] Not ready yet. Skipping transition to {vibe}.");
            return;
        }

        if (_transition != null) StopCoroutine(_transition);
        _transition = StartCoroutine(RunTransition(target.Value));
    }

    private IEnumerator RunTransition(T target)
    {
        yield return TransitionTo(target, transitionDuration);
        _transition = null;
    }

    /// <summary>
    /// Override to check if dependencies are ready (e.g., particle system assigned).
    /// Default: always ready.
    /// </summary>
    protected virtual bool IsReady() => true;

    /// <summary>
    /// Look up preset by vibe name. Return null for unknown vibes.
    /// </summary>
    protected abstract T? GetPreset(string vibe);

    /// <summary>
    /// Coroutine that interpolates from current state to target preset.
    /// </summary>
    protected abstract IEnumerator TransitionTo(T target, float duration);
}
