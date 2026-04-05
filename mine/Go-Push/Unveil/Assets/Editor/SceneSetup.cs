using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Editor utility: sets up AmbientSky scene with GameBootstrapper and configures WebGL build.
/// Menu: Go-Push > Setup Scene + Build WebGL
/// Also runs automatically via [InitializeOnLoad] if the Bootstrapper is missing.
/// </summary>
public static class SceneSetup
{
    private const string AmbientSkyPath = "Assets/Scenes/AmbientSky.unity";
    // Resolve output path relative to project — batch mode CWD may differ
    private static string WebGLOutputPath
    {
        get
        {
            string projectRoot = System.IO.Path.GetFullPath(Application.dataPath + "/..");
            return System.IO.Path.GetFullPath(System.IO.Path.Combine(projectRoot, "../frontend/public/unity-build"));
        }
    }

    [MenuItem("Go-Push/Setup AmbientSky Scene")]
    public static void SetupScene()
    {
        // Open AmbientSky scene
        var scene = EditorSceneManager.OpenScene(AmbientSkyPath, OpenSceneMode.Single);
        if (!scene.IsValid())
        {
            Debug.LogError($"[SceneSetup] Could not open {AmbientSkyPath}");
            return;
        }

        // Check if Bootstrapper already exists
        var existing = GameObject.Find("Bootstrapper");
        if (existing != null)
        {
            Debug.Log("[SceneSetup] Bootstrapper already exists in scene. Skipping.");
            return;
        }

        // Create Bootstrapper GameObject
        var bootstrapper = new GameObject("Bootstrapper");
        bootstrapper.AddComponent<GameBootstrapper>();

        // Remove any existing cameras/lights (Bootstrapper creates its own)
        CleanDefaultObjects();

        // Mark scene dirty and save
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        Debug.Log("[SceneSetup] AmbientSky scene configured with Bootstrapper.");
    }

    [MenuItem("Go-Push/Build WebGL")]
    public static void BuildWebGL()
    {
        SetupScene();

        // Ensure AmbientSky is the only scene in build
        EditorBuildSettings.scenes = new[]
        {
            new EditorBuildSettingsScene(AmbientSkyPath, true)
        };

        var options = new BuildPlayerOptions
        {
            scenes = new[] { AmbientSkyPath },
            locationPathName = WebGLOutputPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None,
        };

        // WebGL-specific optimizations
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled; // Let Next.js handle compression
        PlayerSettings.WebGL.template = "APPLICATION:Default";
        PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None;
        PlayerSettings.SetManagedStrippingLevel(UnityEditor.Build.NamedBuildTarget.WebGL, ManagedStrippingLevel.High);
        PlayerSettings.stripEngineCode = true;

        // Product name matches build config
        PlayerSettings.productName = "Unveil";

        Debug.Log("[SceneSetup] Starting WebGL build...");
        var report = BuildPipeline.BuildPlayer(options);

        if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
        {
            Debug.Log($"[SceneSetup] WebGL build succeeded: {report.summary.totalSize / (1024 * 1024)}MB");
        }
        else
        {
            Debug.LogError($"[SceneSetup] WebGL build failed: {report.summary.result}");
        }
    }

    /// <summary>
    /// Batch-mode entry point: unity -executeMethod SceneSetup.BatchBuild
    /// </summary>
    public static void BatchBuild()
    {
        BuildWebGL();
    }

    private static void CleanDefaultObjects()
    {
        // Remove default "Main Camera" and "Directional Light" if they exist
        // (Bootstrapper creates these at runtime)
        var names = new[] { "Main Camera", "Directional Light" };
        foreach (var name in names)
        {
            var obj = GameObject.Find(name);
            if (obj != null)
            {
                Object.DestroyImmediate(obj);
                Debug.Log($"[SceneSetup] Removed default {name}");
            }
        }
    }
}
