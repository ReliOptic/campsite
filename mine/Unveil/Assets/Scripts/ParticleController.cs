using System.Collections;
using UnityEngine;

/// <summary>
/// Controls ambient particle system presets per mood vibe.
/// Transitions color, speed, size, and emission rate.
/// </summary>
public class ParticleController : MoodControllerBase<ParticleController.ParticlePreset>
{
    [System.Serializable]
    public struct ParticlePreset
    {
        public Color color;
        public float speed;
        public int count;
        public float size;
    }

    [Header("Particle System")]
    [SerializeField] private ParticleSystem mainParticles;

    public void Inject(ParticleSystem ps)
    {
        mainParticles = ps;
    }

    [Header("Mood Presets")]
    [SerializeField] private ParticlePreset calmPreset = new ParticlePreset
    {
        color = new Color(0.267f, 0.667f, 0.800f, 1f),
        speed = 0.5f,
        count = 80,
        size = 0.08f
    };

    [SerializeField] private ParticlePreset heavyPreset = new ParticlePreset
    {
        color = new Color(0.533f, 0.400f, 0.667f, 1f),
        speed = 0.2f,
        count = 40,
        size = 0.12f
    };

    [SerializeField] private ParticlePreset restlessPreset = new ParticlePreset
    {
        color = new Color(0.800f, 0.400f, 0.267f, 1f),
        speed = 1.8f,
        count = 120,
        size = 0.05f
    };

    [SerializeField] private ParticlePreset driftPreset = new ParticlePreset
    {
        color = new Color(0.533f, 0.667f, 0.533f, 1f),
        speed = 0.8f,
        count = 60,
        size = 0.10f
    };

    [SerializeField] private ParticlePreset agoraPreset = new ParticlePreset
    {
        color = new Color(0.800f, 0.600f, 0.500f, 1f),
        speed = 0.6f,
        count = 70,
        size = 0.07f
    };

    // ─── MoodControllerBase overrides ────────────────────────────

    protected override bool IsReady() => mainParticles != null;

    protected override ParticlePreset? GetPreset(string vibe)
    {
        return vibe.ToLower() switch
        {
            "calm"     => calmPreset,
            "heavy"    => heavyPreset,
            "restless" => restlessPreset,
            "drift"    => driftPreset,
            "agora"    => agoraPreset,
            _          => null
        };
    }

    protected override IEnumerator TransitionTo(ParticlePreset target, float duration)
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
    }
}
