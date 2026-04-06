using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// Self-bootstrapping scene initializer. Creates the entire AmbientSky scene hierarchy
/// at runtime: camera, lights, particles, mood worlds, threshold structure, and all controllers.
/// Attach to a single empty GameObject named "Bootstrapper" in the AmbientSky scene.
/// Contemplative exploration architecture — no combat metaphors.
/// </summary>
public class GameBootstrapper : MonoBehaviour
{
    private void Awake()
    {
        // ─── 1. Camera ───���─────────────────────────────────────────
        var cameraGo = SetupCamera();

        // ��── 2. Post-Processing ────────────────────────────────────
        SetupPostProcessing(cameraGo);

        // ─── 3. Lighting ─────────���──────────────────────────────────
        var (lightingRig, directionalLight) = SetupLighting();

        // ─── 4. Particles ──────────────���────────────────────────────
        var (particleRig, particleSystem) = SetupParticles();

        // ─── 5. Mood Worlds (procedural geometry) ─────────��─────────
        var moodWorldTemplates = BuildMoodWorldTemplates();

        // ─── 6. Threshold Structure (formerly BossOrb) ──────────────
        var thresholdTemplate = ProceduralWorldBuilder.BuildThresholdStructure();
        thresholdTemplate.SetActive(false);

        // ─── 7. Controllers ───────���─────────────────────────────────
        SetupGameManager(
            lightingRig, directionalLight,
            particleRig, particleSystem,
            moodWorldTemplates, thresholdTemplate
        );

        Debug.Log("[GameBootstrapper] Scene bootstrapped successfully");
    }

    private GameObject SetupCamera()
    {
        var existing = Camera.main;
        if (existing != null)
        {
            ConfigureOrthographicCamera(existing);
            return existing.gameObject;
        }

        var go = new GameObject("MainCamera");
        go.tag = "MainCamera";
        var cam = go.AddComponent<Camera>();
        ConfigureOrthographicCamera(cam);
        go.AddComponent<AudioListener>();

        return go;
    }

    private static void ConfigureOrthographicCamera(Camera cam)
    {
        cam.orthographic = true;
        cam.orthographicSize = 5f;
        cam.nearClipPlane = 0.1f;
        cam.farClipPlane = 100f;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.06f, 0.06f, 0.10f);

        // Isometric angle
        cam.transform.position = new Vector3(0f, 8f, -8f);
        cam.transform.rotation = Quaternion.Euler(30f, 0f, 0f);
    }

    private static void SetupPostProcessing(GameObject cameraGo)
    {
        // Add Volume component for global post-processing
        var volume = cameraGo.AddComponent<Volume>();
        volume.isGlobal = true;
        volume.priority = 1;

        var profile = ScriptableObject.CreateInstance<VolumeProfile>();
        volume.profile = profile;

        // Bloom — soft glow on emissive elements
        if (profile.TryGet<UnityEngine.Rendering.Universal.Bloom>(out var bloom))
        {
            bloom.active = true;
        }
        else
        {
            bloom = profile.Add<UnityEngine.Rendering.Universal.Bloom>();
            bloom.intensity.Override(0.3f);
            bloom.threshold.Override(0.8f);
            bloom.scatter.Override(0.7f);
        }

        // Vignette — draws eye to center
        if (profile.TryGet<UnityEngine.Rendering.Universal.Vignette>(out var vignette))
        {
            vignette.active = true;
        }
        else
        {
            vignette = profile.Add<UnityEngine.Rendering.Universal.Vignette>();
            vignette.intensity.Override(0.25f);
            vignette.smoothness.Override(0.4f);
        }

        // Color Adjustments — slight saturation and contrast boost
        if (profile.TryGet<UnityEngine.Rendering.Universal.ColorAdjustments>(out var color))
        {
            color.active = true;
        }
        else
        {
            color = profile.Add<UnityEngine.Rendering.Universal.ColorAdjustments>();
            color.saturation.Override(10f);
            color.contrast.Override(5f);
        }
    }

    private (GameObject rig, Light directionalLight) SetupLighting()
    {
        var rig = new GameObject("LightingRig");

        var lightGo = new GameObject("DirectionalLight");
        lightGo.transform.SetParent(rig.transform);
        lightGo.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        var light = lightGo.AddComponent<Light>();
        light.type = LightType.Directional;
        light.color = new Color(0.80f, 0.92f, 1.00f);
        light.intensity = 1.2f;
        light.shadows = LightShadows.Soft;

        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        RenderSettings.ambientLight = new Color(0.20f, 0.35f, 0.45f);

        return (rig, light);
    }

    private (GameObject rig, ParticleSystem ps) SetupParticles()
    {
        var rig = new GameObject("ParticleRig");

        var psGo = new GameObject("AmbientParticles");
        psGo.transform.SetParent(rig.transform);
        psGo.transform.localPosition = new Vector3(0f, 5f, 0f);

        var ps = psGo.AddComponent<ParticleSystem>();

        var main = ps.main;
        main.loop = true;
        main.startLifetime = 8f;
        main.startSpeed = 0.5f;
        main.startSize = 0.08f;
        main.startColor = new Color(0.267f, 0.667f, 0.800f, 0.6f);
        main.maxParticles = 200;
        main.simulationSpace = ParticleSystemSimulationSpace.World;
        main.gravityModifier = -0.02f;

        var emission = ps.emission;
        emission.rateOverTime = 80;

        var shape = ps.shape;
        shape.shapeType = ParticleSystemShapeType.Box;
        shape.scale = new Vector3(12f, 2f, 12f);

        var renderer = psGo.GetComponent<ParticleSystemRenderer>();
        renderer.renderMode = ParticleSystemRenderMode.Billboard;

        var mat = new Material(Shader.Find("Particles/Standard Unlit"));
        if (mat != null)
        {
            mat.SetFloat("_Mode", 1f);
            mat.color = new Color(1f, 1f, 1f, 0.3f);
        }
        renderer.sharedMaterial = mat;

        return (rig, ps);
    }

    private GameObject[] BuildMoodWorldTemplates()
    {
        var calm = ProceduralWorldBuilder.BuildCalmWorld();
        var heavy = ProceduralWorldBuilder.BuildHeavyWorld();
        var restless = ProceduralWorldBuilder.BuildRestlessWorld();
        var drift = ProceduralWorldBuilder.BuildDriftWorld();
        var agora = ProceduralWorldBuilder.BuildAgoraWorld();

        calm.SetActive(false);
        heavy.SetActive(false);
        restless.SetActive(false);
        drift.SetActive(false);
        agora.SetActive(false);

        return new[] { calm, heavy, restless, drift, agora };
    }

    private GameObject SetupGameManager(
        GameObject lightingRig, Light directionalLight,
        GameObject particleRig, ParticleSystem particleSystem,
        GameObject[] moodTemplates, GameObject thresholdTemplate)
    {
        var gm = new GameObject("GameManager");

        var sceneCtrl = gm.AddComponent<SceneController>();
        var particleCtrl = particleRig.AddComponent<ParticleController>();
        var lightingCtrl = lightingRig.AddComponent<LightingController>();
        var webBridge = gm.AddComponent<WebBridge>();

        sceneCtrl.Inject(moodTemplates, thresholdTemplate);
        sceneCtrl.InjectLight(directionalLight);
        particleCtrl.Inject(particleSystem);
        lightingCtrl.Inject(directionalLight);
        webBridge.Inject(sceneCtrl, particleCtrl, lightingCtrl);

        return gm;
    }
}
