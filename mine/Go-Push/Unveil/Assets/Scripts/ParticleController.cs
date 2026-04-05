using System.Collections;
using UnityEngine;

/// <summary>
/// Controls ambient particle system presets per mood vibe.
/// Attach to ParticleRig GameObject in AmbientSky scene.
/// mainParticles will be null until Phase 2 assigns it — null-checked throughout.
/// </summary>
public class ParticleController : MonoBehaviour
{
    [System.Serializable]
    public struct ParticlePreset
    {
        public Color color;
        public float speed;
        public int count;
        public float size;
    }

    [Header("Particle System (assign in Phase 2)")]
    [SerializeField] private ParticleSystem mainParticles;

    public void Inject(ParticleSystem ps)
    {
        mainParticles = ps;
    }

    [Header("Mood Presets")]
    [SerializeField] private ParticlePreset calmPreset = new ParticlePreset
    {
        color = new Color(0.267f, 0.667f, 0.800f, 1f), // #44aacc
        speed = 0.5f,
        count = 80,
        size = 0.08f
    };

    [SerializeField] private ParticlePreset heavyPreset = new ParticlePreset
    {
        color = new Color(0.533f, 0.400f, 0.667f, 1f), // #8866aa
        speed = 0.2f,
        count = 40,
        size = 0.12f
    };

    [SerializeField] private ParticlePreset restlessPreset = new ParticlePreset
    {
        color = new Color(0.800f, 0.400f, 0.267f, 1f), // #cc6644
        speed = 1.8f,
        count = 120,
        size = 0.05f
    };

    [SerializeField] private ParticlePreset driftPreset = new ParticlePreset
    {
        color = new Color(0.533f, 0.667f, 0.533f, 1f), // #88aa88
        speed = 0.8f,
        count = 60,
        size = 0.10f
    };

    private Coroutine _transition;
    private string _currentVibe = "";

    public void SetMood(string vibe)
    {
        if (string.IsNullOrEmpty(vibe) || vibe == _currentVibe) return;
        _currentVibe = vibe;

        ParticlePreset? target = GetPreset(vibe);
        if (target == null)
        {
            Debug.LogWarning($"[ParticleController] Unknown vibe: {vibe}");
            return;
        }

        if (mainParticles == null)
        {
            Debug.Log($"[ParticleController] mainParticles not assigned yet (Phase 2). Skipping transition to {vibe}.");
            return;
        }

        if (_transition != null) StopCoroutine(_transition);
        _transition = StartCoroutine(TransitionTo(target.Value, 1.0f));
    }

    private ParticlePreset? GetPreset(string vibe)
    {
        switch (vibe.ToLower())
        {
            case "calm":      return calmPreset;
            case "heavy":     return heavyPreset;
            case "restless":  return restlessPreset;
            case "drift":     return driftPreset;
            default:          return null;
        }
    }

    private IEnumerator TransitionTo(ParticlePreset target, float duration)
    {
        ParticleSystem.MainModule main = mainParticles.main;
        ParticleSystem.EmissionModule emission = mainParticles.emission;

        Color startColor = main.startColor.color;
        float startSpeed = main.startSpeed.constant;
        float startSize = main.startSize.constant;
        float startCount = emission.rateOverTime.constant;

        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.SmoothStep(0f, 1f, elapsed / duration);

            main.startColor = Color.Lerp(startColor, target.color, t);
            main.startSpeed = Mathf.Lerp(startSpeed, target.speed, t);
            main.startSize = Mathf.Lerp(startSize, target.size, t);
            emission.rateOverTime = Mathf.Lerp(startCount, target.count, t);

            yield return null;
        }

        main.startColor = target.color;
        main.startSpeed = target.speed;
        main.startSize = target.size;
        emission.rateOverTime = target.count;

        _transition = null;
    }
}
