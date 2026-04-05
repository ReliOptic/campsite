using UnityEngine;

/// <summary>
/// Generates Monument Valley-style low-poly isometric geometry for mood worlds and boss orb.
/// All geometry is procedural — no texture assets, no prefabs, no editor setup required.
/// Flat-shaded with pastel URP Lit materials.
/// </summary>
public static class ProceduralWorldBuilder
{
    // ─── Mood World Factories ───────────────────────────────────────

    public static GameObject BuildCalmWorld()
    {
        var root = new GameObject("MoodWorld_Calm");

        // Ground platform — soft blue-teal hexagonal platform
        var platform = CreateCylinder("Platform", 12, 6f, 0.3f);
        platform.transform.SetParent(root.transform);
        platform.transform.localPosition = Vector3.zero;
        SetMaterial(platform, new Color(0.55f, 0.78f, 0.82f)); // soft teal

        // Zen pillars — varying heights in circular arrangement
        float[] heights = { 2.0f, 3.2f, 1.5f, 2.8f, 1.8f, 3.5f, 2.3f };
        float radius = 3.5f;
        for (int i = 0; i < heights.Length; i++)
        {
            float angle = i * Mathf.PI * 2f / heights.Length;
            var pillar = CreateCylinder($"Pillar_{i}", 6, 0.35f, heights[i]);
            pillar.transform.SetParent(root.transform);
            pillar.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * radius,
                heights[i] * 0.5f,
                Mathf.Sin(angle) * radius
            );
            float hue = 0.52f + i * 0.01f; // subtle hue variation
            SetMaterial(pillar, Color.HSVToRGB(hue, 0.25f, 0.85f));
        }

        // Central gentle sphere
        var orb = CreateSphere("CenterOrb", 0.6f, 2);
        orb.transform.SetParent(root.transform);
        orb.transform.localPosition = new Vector3(0f, 1.2f, 0f);
        SetMaterial(orb, new Color(0.75f, 0.92f, 0.95f, 0.8f), transparent: true);

        // Small stepped pyramids
        for (int i = 0; i < 3; i++)
        {
            float a = i * Mathf.PI * 2f / 3f + 0.5f;
            var pyramid = CreateSteppedPyramid($"StepPyramid_{i}", 3, 0.8f, 0.4f);
            pyramid.transform.SetParent(root.transform);
            pyramid.transform.localPosition = new Vector3(
                Mathf.Cos(a) * 1.5f, 0.3f, Mathf.Sin(a) * 1.5f
            );
            SetMaterial(pyramid, new Color(0.60f, 0.82f, 0.78f));
        }

        return root;
    }

    public static GameObject BuildHeavyWorld()
    {
        var root = new GameObject("MoodWorld_Heavy");

        // Ground — dark purple slab
        var platform = CreateBox("Platform", 10f, 0.4f, 10f);
        platform.transform.SetParent(root.transform);
        platform.transform.localPosition = new Vector3(0f, -0.2f, 0f);
        SetMaterial(platform, new Color(0.22f, 0.14f, 0.30f));

        // Dense angular blocks — irregular ruins
        Vector3[] blockPositions = {
            new(-2f, 0.8f, -1f), new(1.5f, 1.2f, 0.5f), new(-0.5f, 0.5f, 2f),
            new(2.5f, 0.6f, -2f), new(-1.5f, 1.5f, 1.5f), new(0f, 0.4f, -2.5f),
            new(3f, 0.3f, 1f), new(-2.5f, 0.7f, -2.5f), new(1f, 1.0f, -1.5f),
        };
        Vector3[] blockScales = {
            new(1.2f, 1.6f, 0.8f), new(0.7f, 2.4f, 1.0f), new(1.5f, 1.0f, 0.6f),
            new(0.8f, 1.2f, 1.4f), new(0.6f, 3.0f, 0.5f), new(1.0f, 0.8f, 1.0f),
            new(0.5f, 0.6f, 0.8f), new(1.3f, 1.4f, 0.7f), new(0.9f, 2.0f, 0.9f),
        };

        for (int i = 0; i < blockPositions.Length; i++)
        {
            var block = CreateBox($"Ruin_{i}", blockScales[i].x, blockScales[i].y, blockScales[i].z);
            block.transform.SetParent(root.transform);
            block.transform.localPosition = blockPositions[i];
            block.transform.localRotation = Quaternion.Euler(0f, i * 23f, 0f); // slight rotation
            float shade = 0.20f + i * 0.03f;
            SetMaterial(block, new Color(shade + 0.10f, shade, shade + 0.15f));
        }

        // Heavy hanging slab
        var slab = CreateBox("HangingSlab", 3f, 0.3f, 2f);
        slab.transform.SetParent(root.transform);
        slab.transform.localPosition = new Vector3(0f, 4f, 0f);
        slab.transform.localRotation = Quaternion.Euler(5f, 15f, -3f);
        SetMaterial(slab, new Color(0.35f, 0.25f, 0.45f));

        return root;
    }

    public static GameObject BuildRestlessWorld()
    {
        var root = new GameObject("MoodWorld_Restless");

        // Ground — cracked warm amber surface
        var platform = CreateCylinder("Platform", 8, 5.5f, 0.25f);
        platform.transform.SetParent(root.transform);
        platform.transform.localPosition = Vector3.zero;
        SetMaterial(platform, new Color(0.45f, 0.28f, 0.15f));

        // Angular shards pointing outward — volcanic spikes
        for (int i = 0; i < 10; i++)
        {
            float angle = i * Mathf.PI * 2f / 10f + Random.Range(-0.2f, 0.2f);
            float dist = 2f + i * 0.3f;
            float height = 1.0f + i * 0.35f;

            var shard = CreateShard($"Shard_{i}", 0.15f + i * 0.02f, height);
            shard.transform.SetParent(root.transform);
            shard.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * dist, height * 0.3f, Mathf.Sin(angle) * dist
            );
            // Tilt outward from center
            float tilt = 15f + i * 3f;
            shard.transform.localRotation = Quaternion.Euler(-tilt, angle * Mathf.Rad2Deg, 0f);

            float warmth = 0.6f + i * 0.03f;
            SetMaterial(shard, new Color(warmth, warmth * 0.55f, warmth * 0.25f));
        }

        // Central lava orb — glowing warm
        var core = CreateSphere("LavaCore", 0.8f, 2);
        core.transform.SetParent(root.transform);
        core.transform.localPosition = new Vector3(0f, 1.5f, 0f);
        SetMaterial(core, new Color(1f, 0.45f, 0.15f, 0.9f), transparent: true, emission: new Color(0.8f, 0.3f, 0.05f));

        return root;
    }

    public static GameObject BuildDriftWorld()
    {
        var root = new GameObject("MoodWorld_Drift");

        // Floating islands at various heights — dreamy green
        Vector3[] islandPositions = {
            new(0f, 0f, 0f), new(3f, 1.5f, 2f), new(-2.5f, 2.5f, 1f),
            new(1.5f, 3.5f, -2f), new(-1f, 1.0f, -3f), new(4f, 0.5f, -1f),
            new(-3.5f, 4f, -0.5f),
        };
        float[] islandSizes = { 2.5f, 1.5f, 1.8f, 1.2f, 1.6f, 1.0f, 0.8f };

        for (int i = 0; i < islandPositions.Length; i++)
        {
            var island = CreateFloatingIsland($"Island_{i}", islandSizes[i]);
            island.transform.SetParent(root.transform);
            island.transform.localPosition = islandPositions[i];
            island.transform.localRotation = Quaternion.Euler(0f, i * 37f, 0f);

            float green = 0.55f + i * 0.04f;
            SetMaterial(island, new Color(green * 0.7f, green, green * 0.7f));
        }

        // Tiny connecting bridges (thin boxes between some islands)
        var bridge1 = CreateBox("Bridge_0", 0.12f, 0.06f, 2.5f);
        bridge1.transform.SetParent(root.transform);
        bridge1.transform.localPosition = new Vector3(1.5f, 0.75f, 1f);
        bridge1.transform.localRotation = Quaternion.Euler(10f, 35f, 0f);
        SetMaterial(bridge1, new Color(0.65f, 0.80f, 0.65f));

        return root;
    }

    // ─── Boss Orb ───────────────────────────────────────────────────

    public static GameObject BuildBossOrb()
    {
        var root = new GameObject("BossOrb");

        // Core sphere — dark pulsing orb
        var core = CreateSphere("Core", 0.7f, 3);
        core.transform.SetParent(root.transform);
        core.transform.localPosition = new Vector3(0f, 3f, 0f);
        SetMaterial(core, new Color(0.15f, 0.08f, 0.20f), emission: new Color(0.4f, 0.15f, 0.5f));

        // Outer ring — orbiting fragments
        for (int i = 0; i < 6; i++)
        {
            float angle = i * Mathf.PI * 2f / 6f;
            var fragment = CreateBox($"Fragment_{i}", 0.2f, 0.2f, 0.2f);
            fragment.transform.SetParent(core.transform);
            fragment.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * 1.2f, 0f, Mathf.Sin(angle) * 1.2f
            );
            fragment.transform.localRotation = Quaternion.Euler(45f, angle * Mathf.Rad2Deg, 45f);
            SetMaterial(fragment, new Color(0.50f, 0.25f, 0.60f, 0.7f), transparent: true);
        }

        // Add slow rotation to the core
        var rotator = core.AddComponent<SlowRotator>();
        rotator.speed = 15f;

        return root;
    }

    // ─── Primitive Builders ─────────────────────────────────────────

    private static GameObject CreateBox(string name, float w, float h, float d)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
        go.name = name;
        go.transform.localScale = new Vector3(w, h, d);
        // Remove collider for visual-only objects
        Object.Destroy(go.GetComponent<Collider>());
        return go;
    }

    private static GameObject CreateSphere(string name, float radius, int detail)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        go.name = name;
        go.transform.localScale = Vector3.one * radius * 2f;
        Object.Destroy(go.GetComponent<Collider>());
        return go;
    }

    private static GameObject CreateCylinder(string name, int segments, float radius, float height)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        go.name = name;
        go.transform.localScale = new Vector3(radius * 2f, height * 0.5f, radius * 2f);
        Object.Destroy(go.GetComponent<Collider>());
        return go;
    }

    private static GameObject CreateShard(string name, float baseSize, float height)
    {
        // Shard = tall narrow cube tapered conceptually (scaled cube is sufficient for low-poly)
        var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
        go.name = name;
        go.transform.localScale = new Vector3(baseSize, height, baseSize * 0.6f);
        Object.Destroy(go.GetComponent<Collider>());
        return go;
    }

    private static GameObject CreateSteppedPyramid(string name, int steps, float baseSize, float stepHeight)
    {
        var root = new GameObject(name);
        for (int i = 0; i < steps; i++)
        {
            float size = baseSize * (1f - i * 0.3f);
            var step = CreateBox($"Step_{i}", size, stepHeight, size);
            step.transform.SetParent(root.transform);
            step.transform.localPosition = new Vector3(0f, i * stepHeight, 0f);
        }
        return root;
    }

    private static GameObject CreateFloatingIsland(string name, float size)
    {
        var root = new GameObject(name);

        // Top surface — flat cylinder
        var top = CreateCylinder("Top", 6, size * 0.5f, 0.15f);
        top.transform.SetParent(root.transform);
        top.transform.localPosition = Vector3.zero;

        // Bottom — inverted tapered shape (smaller cylinder underneath)
        var bottom = CreateCylinder("Bottom", 5, size * 0.25f, 0.3f);
        bottom.transform.SetParent(root.transform);
        bottom.transform.localPosition = new Vector3(0f, -0.2f, 0f);

        // Small detail — tiny cube "tree" on top
        if (size > 1.2f)
        {
            var tree = CreateBox("Tree", 0.1f, 0.4f, 0.1f);
            tree.transform.SetParent(root.transform);
            tree.transform.localPosition = new Vector3(size * 0.15f, 0.28f, 0f);
            SetMaterial(tree, new Color(0.3f, 0.55f, 0.3f));

            var canopy = CreateSphere("Canopy", 0.18f, 1);
            canopy.transform.SetParent(root.transform);
            canopy.transform.localPosition = new Vector3(size * 0.15f, 0.55f, 0f);
            SetMaterial(canopy, new Color(0.4f, 0.7f, 0.4f));
        }

        return root;
    }

    // ─── Material Helpers ───────────────────────────────────────────

    private static void SetMaterial(GameObject go, Color color, bool transparent = false, Color? emission = null)
    {
        var renderer = go.GetComponent<Renderer>();
        if (renderer == null) return;

        // Use URP Lit shader if available, fallback to Standard
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null) shader = Shader.Find("Standard");

        var mat = new Material(shader);
        mat.color = color;

        if (transparent)
        {
            mat.SetFloat("_Surface", 1f); // URP transparent
            mat.SetFloat("_Blend", 0f);
            mat.SetOverrideTag("RenderType", "Transparent");
            mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetInt("_ZWrite", 0);
            mat.renderQueue = 3000;
            mat.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
        }

        if (emission.HasValue)
        {
            mat.EnableKeyword("_EMISSION");
            mat.SetColor("_EmissionColor", emission.Value);
        }

        renderer.sharedMaterial = mat;
    }

    /// <summary>
    /// Recursively sets material on all renderers in a hierarchy.
    /// </summary>
    public static void SetMaterialRecursive(GameObject go, Color color)
    {
        foreach (var renderer in go.GetComponentsInChildren<Renderer>())
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            var mat = new Material(shader);
            mat.color = color;
            renderer.sharedMaterial = mat;
        }
    }
}
