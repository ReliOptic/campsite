using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// Controls URP lighting and post-processing presets per mood vibe.
/// Transitions ambient light, directional light, bloom, and vignette.
/// </summary>
public class LightingController : MoodControllerBase<LightingController.LightingPreset>
{
    [System.Serializable]
    public struct LightingPreset
    {
        public Color ambientColor;
        public Color lightColor;
        public float intensity;
        public float bloomIntensity;
        public float vignetteIntensity;
    }

    [Header("Directional Light")]
    [SerializeField] private Light directionalLight;

    public void Inject(Light light)
    {
        directionalLight = light;
    }

    [Header("Mood Presets")]
    [SerializeField] private LightingPreset calmPreset = new LightingPreset
    {
        ambientColor = new Color(0.20f, 0.35f, 0.45f, 1f),
        lightColor   = new Color(0.80f, 0.92f, 1.00f, 1f),
        intensity    = 1.2f,
        bloomIntensity = 0.3f,
        vignetteIntensity = 0.20f
    };

    [SerializeField] private LightingPreset heavyPreset = new LightingPreset
    {
        ambientColor = new Color(0.18f, 0.10f, 0.25f, 1f),
        lightColor   = new Color(0.60f, 0.50f, 0.80f, 1f),
        intensity    = 0.6f,
        bloomIntensity = 0.15f,
        vignetteIntensity = 0.40f
    };

    [SerializeField] private LightingPreset restlessPreset = new LightingPreset
    {
        ambientColor = new Color(0.35f, 0.20f, 0.10f, 1f),
        lightColor   = new Color(1.00f, 0.75f, 0.45f, 1f),
        intensity    = 1.5f,
        bloomIntensity = 0.50f,
        vignetteIntensity = 0.25f
    };

    [SerializeField] private LightingPreset driftPreset = new LightingPreset
    {
        ambientColor = new Color(0.18f, 0.28f, 0.18f, 1f),
        lightColor   = new Color(0.75f, 0.90f, 0.75f, 1f),
        intensity    = 1.0f,
        bloomIntensity = 0.25f,
        vignetteIntensity = 0.15f
    };

    [SerializeField] private LightingPreset agoraPreset = new LightingPreset
    {
        ambientColor = new Color(0.35f, 0.22f, 0.18f, 1f),
        lightColor   = new Color(1.00f, 0.80f, 0.65f, 1f),
        intensity    = 1.3f,
        bloomIntensity = 0.35f,
        vignetteIntensity = 0.18f
    };

    [Header("Night Mode")]
    [SerializeField] private LightingPreset nightPreset = new LightingPreset
    {
        ambientColor = new Color(0.05f, 0.05f, 0.12f, 1f),
        lightColor   = new Color(0.25f, 0.28f, 0.45f, 1f),
        intensity    = 0.3f,
        bloomIntensity = 0.60f,
        vignetteIntensity = 0.45f
    };

    [SerializeField] private int nightHour = 22;
    [SerializeField] private int nightMinute = 15;
    [SerializeField] private int dayHour = 6;
    [SerializeField] private int dayMinute = 0;

    private Volume _volume;
    private bool _isNightMode;
    private LightingPreset? _dayPresetBackup;
    private float _nightCheckInterval = 60f;
    private float _nextNightCheck;
    private Coroutine _nightTransition;

    public bool IsNightMode => _isNightMode;

    private void Start()
    {
        _volume = FindAnyObjectByType<Volume>();
        CheckNightMode();
    }

    private void Update()
    {
        if (Time.time < _nextNightCheck) return;
        _nextNightCheck = Time.time + _nightCheckInterval;
        CheckNightMode();
    }

    // ─── MoodControllerBase overrides ────────────────────────────

    protected override LightingPreset? GetPreset(string vibe)
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

    protected override IEnumerator TransitionTo(LightingPreset target, float duration)
    {
        Color startAmbient = RenderSettings.ambientLight;
        Color startLightColor = directionalLight != null ? directionalLight.color : Color.white;
        float startIntensity = directionalLight != null ? directionalLight.intensity : 1f;

        float startBloom = 0.3f, startVignette = 0.25f;
        UnityEngine.Rendering.Universal.Bloom bloom = null;
        UnityEngine.Rendering.Universal.Vignette vignette = null;

        if (_volume != null && _volume.profile != null)
        {
            if (_volume.profile.TryGet(out bloom))
                startBloom = bloom.intensity.value;
            if (_volume.profile.TryGet(out vignette))
                startVignette = vignette.intensity.value;
        }

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

            if (bloom != null)
                bloom.intensity.Override(Mathf.Lerp(startBloom, target.bloomIntensity, t));
            if (vignette != null)
                vignette.intensity.Override(Mathf.Lerp(startVignette, target.vignetteIntensity, t));

            yield return null;
        }

        RenderSettings.ambientLight = target.ambientColor;
        if (directionalLight != null)
        {
            directionalLight.color     = target.lightColor;
            directionalLight.intensity = target.intensity;
        }
        if (bloom != null) bloom.intensity.Override(target.bloomIntensity);
        if (vignette != null) vignette.intensity.Override(target.vignetteIntensity);
    }

    // ─── Night Mode (LightingController-specific) ────────────────

    private void CheckNightMode()
    {
        var now = System.DateTime.Now;
        bool shouldBeNight = IsNightTime(now.Hour, now.Minute);

        if (shouldBeNight && !_isNightMode)
            EnableNightMode();
        else if (!shouldBeNight && _isNightMode)
            DisableNightMode();
    }

    private bool IsNightTime(int hour, int minute)
    {
        int currentMinutes = hour * 60 + minute;
        int nightStart = nightHour * 60 + nightMinute;
        int dayStart = dayHour * 60 + dayMinute;

        if (nightStart > dayStart)
            return currentMinutes >= nightStart || currentMinutes < dayStart;
        return currentMinutes >= nightStart && currentMinutes < dayStart;
    }

    private void EnableNightMode()
    {
        _isNightMode = true;

        if (directionalLight != null)
        {
            _dayPresetBackup = new LightingPreset
            {
                ambientColor = RenderSettings.ambientLight,
                lightColor = directionalLight.color,
                intensity = directionalLight.intensity,
                bloomIntensity = nightPreset.bloomIntensity,
                vignetteIntensity = nightPreset.vignetteIntensity
            };
        }

        if (_nightTransition != null) StopCoroutine(_nightTransition);
        _nightTransition = StartCoroutine(TransitionTo(nightPreset, 3.0f));

        Debug.Log("[LightingController] Night mode enabled");
    }

    private void DisableNightMode()
    {
        _isNightMode = false;
        var target = _dayPresetBackup ?? calmPreset;

        if (_nightTransition != null) StopCoroutine(_nightTransition);
        _nightTransition = StartCoroutine(TransitionTo(target, 3.0f));

        Debug.Log("[LightingController] Night mode disabled");
    }
}
