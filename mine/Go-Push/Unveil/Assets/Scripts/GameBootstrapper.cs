using UnityEngine;

/// <summary>
/// Self-bootstrapping scene initializer. Creates the entire AmbientSky scene hierarchy
/// at runtime: camera, lights, particles, mood worlds, boss orb, and all controllers.
/// Attach to a single empty GameObject named "Bootstrapper" in the AmbientSky scene.
/// This eliminates the need for prefabs, editor-assigned SerializeField refs, or MCP.
/// </summary>
public class GameBootstrapper : MonoBehaviour
{
    private void Awake()
    {
        // ─── 1. Camera ─────────────────────────────────────────────
        var cameraGo = SetupCamera();

        // ─── 2. Lighting ────────────────────────────────────────────
        var (lightingRig, directionalLight) = SetupLighting();

        // ─── 3. Particles ───────────────────────────────────────────
        var (particleRig, particleSystem) = SetupParticles();

        // ─── 4. Mood Worlds (procedural geometry) ───────────────────
        var moodWorldPrefabs = BuildMoodWorldTemplates();

        // ─── 5. Boss Orb ────────────────────────────────────────────
        var bossOrbTemplate = ProceduralWorldBuilder.BuildBossOrb();
        bossOrbTemplate.SetActive(false); // Template, instantiated by SceneController

        // ─── 6. Controllers ─────────────────────────────────────────
        var gameManager = SetupGameManager(
            lightingRig, directionalLight,
            particleRig, particleSystem,
            moodWorldPrefabs, bossOrbTemplate
        );

        Debug.Log("[GameBootstrapper] Scene bootstrapped successfully");
    }

    private GameObject SetupCamera()
    {
        // Check if a camera already exists in the scene
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
        cam.backgroundColor = new Color(0.06f, 0.06f, 0.10f); // colors.bg.deep

        // Isometric angle: 30° X rotation, 45° Y rotation
        cam.transform.position = new Vector3(0f, 8f, -8f);
        cam.transform.rotation = Quaternion.Euler(30f, 0f, 0f);
    }

    private (GameObject rig, Light directionalLight) SetupLighting()
    {
        var rig = new GameObject("LightingRig");

        // Directional light — warm soft key light
        var lightGo = new GameObject("DirectionalLight");
        lightGo.transform.SetParent(rig.transform);
        lightGo.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        var light = lightGo.AddComponent<Light>();
        light.type = LightType.Directional;
        light.color = new Color(0.80f, 0.92f, 1.00f);
        light.intensity = 1.2f;
        light.shadows = LightShadows.Soft;

        // Ambient settings — default to calm preset
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

        // Configure for ambient floating particles
        var main = ps.main;
        main.loop = true;
        main.startLifetime = 8f;
        main.startSpeed = 0.5f;
        main.startSize = 0.08f;
        main.startColor = new Color(0.267f, 0.667f, 0.800f, 0.6f); // calm default
        main.maxParticles = 200;
        main.simulationSpace = ParticleSystemSimulationSpace.World;
        main.gravityModifier = -0.02f; // slight upward drift

        var emission = ps.emission;
        emission.rateOverTime = 80;

        var shape = ps.shape;
        shape.shapeType = ParticleSystemShapeType.Box;
        shape.scale = new Vector3(12f, 2f, 12f);

        // Renderer — small additive particles
        var renderer = psGo.GetComponent<ParticleSystemRenderer>();
        renderer.renderMode = ParticleSystemRenderMode.Billboard;

        // Use default particle material
        var mat = new Material(Shader.Find("Particles/Standard Unlit"));
        if (mat != null)
        {
            mat.SetFloat("_Mode", 1f); // Additive
            mat.color = new Color(1f, 1f, 1f, 0.3f);
        }
        renderer.sharedMaterial = mat;

        return (rig, ps);
    }

    private GameObject[] BuildMoodWorldTemplates()
    {
        // Build all 4 mood worlds as templates (disabled), SceneController will instantiate them
        var calm = ProceduralWorldBuilder.BuildCalmWorld();
        var heavy = ProceduralWorldBuilder.BuildHeavyWorld();
        var restless = ProceduralWorldBuilder.BuildRestlessWorld();
        var drift = ProceduralWorldBuilder.BuildDriftWorld();

        calm.SetActive(false);
        heavy.SetActive(false);
        restless.SetActive(false);
        drift.SetActive(false);

        return new[] { calm, heavy, restless, drift };
    }

    private GameObject SetupGameManager(
        GameObject lightingRig, Light directionalLight,
        GameObject particleRig, ParticleSystem particleSystem,
        GameObject[] moodPrefabs, GameObject bossOrbTemplate)
    {
        var gm = new GameObject("GameManager");

        // Add controllers
        var sceneCtrl = gm.AddComponent<SceneController>();
        var particleCtrl = particleRig.AddComponent<ParticleController>();
        var lightingCtrl = lightingRig.AddComponent<LightingController>();
        var webBridge = gm.AddComponent<WebBridge>();

        // Wire dependencies via injection
        sceneCtrl.Inject(moodPrefabs, bossOrbTemplate);
        particleCtrl.Inject(particleSystem);
        lightingCtrl.Inject(directionalLight);
        webBridge.Inject(sceneCtrl, particleCtrl, lightingCtrl);

        return gm;
    }
}
