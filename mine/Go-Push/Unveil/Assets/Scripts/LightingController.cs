using System.Collections;
using UnityEngine;

/// <summary>
/// Controls URP lighting presets per mood vibe.
/// Attach to LightingRig GameObject in AmbientSky scene.
/// directionalLight will be null until Phase 2 assigns it — null-checked throughout.
/// </summary>
public class LightingController : MonoBehaviour
{
    [System.Serializable]
    public struct LightingPreset
    {
        public Color ambientColor;
        public Color lightColor;
        public float intensity;
    }

    [Header("Directional Light (assign in Phase 2)")]
    [SerializeField] private Light directionalLight;

    public void Inject(Light light)
    {
        directionalLight = light;
    }

    [Header("Mood Presets")]
    [SerializeField] private LightingPreset calmPreset = new LightingPreset
    {
        ambientColor = new Color(0.20f, 0.35f, 0.45f, 1f), // soft blue-teal
        lightColor   = new Color(0.80f, 0.92f, 1.00f, 1f),
        intensity    = 1.2f
    };

    [SerializeField] private LightingPreset heavyPreset = new LightingPreset
    {
        ambientColor = new Color(0.18f, 0.10f, 0.25f, 1f), // deep purple
        lightColor   = new Color(0.60f, 0.50f, 0.80f, 1f),
        intensity    = 0.6f
    };

    [SerializeField] private LightingPreset restlessPreset = new LightingPreset
    {
        ambientColor = new Color(0.35f, 0.20f, 0.10f, 1f), // warm amber
        lightColor   = new Color(1.00f, 0.75f, 0.45f, 1f),
        intensity    = 1.5f
    };

    [SerializeField] private LightingPreset driftPreset = new LightingPreset
    {
        ambientColor = new Color(0.18f, 0.28f, 0.18f, 1f), // muted green
        lightColor   = new Color(0.75f, 0.90f, 0.75f, 1f),
        intensity    = 1.0f
    };

    private Coroutine _transition;
    private string _currentVibe = "";

    public void SetMood(string vibe)
    {
        if (string.IsNullOrEmpty(vibe) || vibe == _currentVibe) return;
        _currentVibe = vibe;

        LightingPreset? target = GetPreset(vibe);
        if (target == null)
        {
            Debug.LogWarning($"[LightingController] Unknown vibe: {vibe}");
            return;
        }

        if (_transition != null) StopCoroutine(_transition);
        _transition = StartCoroutine(TransitionTo(target.Value, 1.0f));
    }

    private LightingPreset? GetPreset(string vibe)
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

    private IEnumerator TransitionTo(LightingPreset target, float duration)
    {
        Color startAmbient = RenderSettings.ambientLight;
        Color startLightColor = directionalLight != null ? directionalLight.color : Color.white;
        float startIntensity = directionalLight != null ? directionalLight.intensity : 1f;

        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.SmoothStep(0f, 1f, elapsed / duration);

            RenderSettings.ambientLight = Color.Lerp(startAmbient, target.ambientColor, t);

            if (directionalLight != null)
            {
                directionalLight.color     = Color.Lerp(startLightColor, target.lightColor, t);
                directionalLight.intensity = Mathf.Lerp(startIntensity, target.intensity, t);
            }

            yield return null;
        }

        RenderSettings.ambientLight = target.ambientColor;
        if (directionalLight != null)
        {
            directionalLight.color     = target.lightColor;
            directionalLight.intensity = target.intensity;
        }

        _transition = null;
    }
}
