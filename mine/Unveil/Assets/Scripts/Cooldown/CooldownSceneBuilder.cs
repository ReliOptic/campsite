using UnityEngine;

/// <summary>
/// Builds 3 cognitive cooldown scenes for between-puzzle rest.
/// Scenario bible G-07: contemplative micro-environments.
///   1. Water Memory (물의 기억) — concentric ripple rings on still water
///   2. Light Growth (빛의 성장) — fractal-like branching plant forms
///   3. Sand Time (모래의 시간) — layered sand dunes with drifting particles
/// All geometry is procedural via MeshBuilder. No prefabs or editor setup.
/// </summary>
public static class CooldownSceneBuilder
{
    // ─── 1. Water Memory (물의 기억) ──────────────────────────────

    /// <summary>
    /// Still water surface with concentric ripple rings expanding outward.
    /// Central droplet orb bobs gently. Rings are flat cylinders at water level.
    /// </summary>
    public static GameObject BuildWaterMemory()
    {
        var root = new GameObject("Cooldown_WaterMemory");

        // Water surface — dark reflective plane
        var water = MeshBuilder.CreateFlatCylinder("WaterSurface", 8, 8f, 0.05f);
        water.transform.SetParent(root.transform);
        water.transform.localPosition = Vector3.zero;
        SetMat(water, new Color(0.08f, 0.15f, 0.25f));

        // Concentric ripple rings
        int ringCount = 5;
        for (int i = 0; i < ringCount; i++)
        {
            float radius = 1.0f + i * 1.3f;
            float thickness = 0.08f - i * 0.01f;
            if (thickness < 0.02f) thickness = 0.02f;

            // Outer ring
            var outerRing = MeshBuilder.CreateFlatCylinder($"Ripple_Outer_{i}", 24, radius + thickness, 0.02f);
            outerRing.transform.SetParent(root.transform);
            outerRing.transform.localPosition = new Vector3(0f, 0.03f + i * 0.005f, 0f);
            float alpha = 0.6f - i * 0.1f;
            SetMatTransparent(outerRing, new Color(0.4f, 0.6f, 0.8f, alpha));

            // Inner cutout ring (slightly smaller, water color, creates ring effect)
            var innerRing = MeshBuilder.CreateFlatCylinder($"Ripple_Inner_{i}", 24, radius, 0.025f);
            innerRing.transform.SetParent(root.transform);
            innerRing.transform.localPosition = new Vector3(0f, 0.035f + i * 0.005f, 0f);
            SetMat(innerRing, new Color(0.08f, 0.15f, 0.25f));

            // Animate ring expansion via FloatBobber (vertical shimmer)
            outerRing.AddComponent<FloatBobber>().Configure(0.01f, 0.3f + i * 0.1f, i * 0.5f);
        }

        // Central droplet orb
        var droplet = MeshBuilder.CreateIcoSphere("Droplet", 0.15f, 1);
        droplet.transform.SetParent(root.transform);
        droplet.transform.localPosition = new Vector3(0f, 0.5f, 0f);
        SetMatUnlit(droplet, new Color(0.5f, 0.75f, 0.95f));
        droplet.AddComponent<FloatBobber>().Configure(0.2f, 0.5f, 0f);

        // Ambient stones at edges
        Vector3[] stonePos = {
            new(-3f, 0f, -2f), new(2.5f, 0f, -3f), new(-2f, 0f, 3.5f), new(4f, 0f, 1f)
        };
        for (int i = 0; i < stonePos.Length; i++)
        {
            var stone = MeshBuilder.CreateIcoSphere($"Stone_{i}", 0.25f + i * 0.08f, 0);
            stone.transform.SetParent(root.transform);
            stone.transform.localPosition = stonePos[i] + Vector3.up * 0.1f;
            stone.transform.localScale = new Vector3(1f, 0.5f, 1f);
            SetMat(stone, new Color(0.25f, 0.28f, 0.30f));
        }

        return root;
    }

    // ─── 2. Light Growth (빛의 성장) ──────────────────────────────

    /// <summary>
    /// Fractal-like branching plant forms growing from a central mound.
    /// Branches are thin pyramids, leaves are small icospheres.
    /// Gentle glow at tips represents growth/hope.
    /// </summary>
    public static GameObject BuildLightGrowth()
    {
        var root = new GameObject("Cooldown_LightGrowth");
        var rng = new System.Random(123);

        // Earth mound
        var mound = MeshBuilder.CreateIcoSphere("Mound", 1.5f, 1);
        mound.transform.SetParent(root.transform);
        mound.transform.localPosition = Vector3.zero;
        mound.transform.localScale = new Vector3(1f, 0.35f, 1f);
        SetMat(mound, new Color(0.30f, 0.22f, 0.15f));

        // Main trunk
        var trunk = MeshBuilder.CreateFlatCylinder("Trunk", 6, 0.12f, 2.5f);
        trunk.transform.SetParent(root.transform);
        trunk.transform.localPosition = new Vector3(0f, 1.25f, 0f);
        SetMat(trunk, new Color(0.35f, 0.28f, 0.18f));

        // Recursive-style branches (2 levels, deterministic)
        BuildBranch(root.transform, new Vector3(0f, 2.5f, 0f), 1.5f, 0, 2, rng);

        // Ground cover — small scattered pyramids (grass/moss)
        for (int i = 0; i < 12; i++)
        {
            float angle = i * Mathf.PI * 2f / 12f;
            float dist = 0.8f + (float)(rng.NextDouble() * 1.5);
            var grass = MeshBuilder.CreatePyramid($"Grass_{i}", 3, 0.08f, 0.15f + (float)(rng.NextDouble() * 0.1));
            grass.transform.SetParent(root.transform);
            grass.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * dist, 0.05f, Mathf.Sin(angle) * dist
            );
            SetMat(grass, new Color(0.25f, 0.45f + (float)(rng.NextDouble() * 0.15), 0.20f));
        }

        return root;
    }

    private static void BuildBranch(Transform parent, Vector3 origin, float length, int depth, int maxDepth, System.Random rng)
    {
        if (depth >= maxDepth) return;

        int branchCount = 3 + depth;
        for (int i = 0; i < branchCount; i++)
        {
            float angle = i * Mathf.PI * 2f / branchCount + (float)(rng.NextDouble() * 0.5);
            float tilt = 25f + depth * 15f + (float)(rng.NextDouble() * 10);
            float branchLen = length * (0.6f + (float)(rng.NextDouble() * 0.2));

            // Branch stem
            var branch = MeshBuilder.CreateFlatCylinder($"Branch_d{depth}_{i}", 4, 0.05f - depth * 0.015f, branchLen);
            branch.transform.SetParent(parent);
            branch.transform.localPosition = origin;
            branch.transform.localRotation = Quaternion.Euler(-tilt, angle * Mathf.Rad2Deg, 0f);

            float green = 0.35f + depth * 0.1f;
            SetMat(branch, new Color(0.30f, green, 0.18f));

            // Leaf/bud at tip
            Vector3 tipLocal = origin + Quaternion.Euler(-tilt, angle * Mathf.Rad2Deg, 0f) * (Vector3.up * branchLen);
            var leaf = MeshBuilder.CreateIcoSphere($"Leaf_d{depth}_{i}", 0.08f + (float)(rng.NextDouble() * 0.05), 0);
            leaf.transform.SetParent(parent);
            leaf.transform.localPosition = tipLocal;

            if (depth == maxDepth - 1)
            {
                // Glowing tips at final depth
                SetMatUnlit(leaf, new Color(0.7f, 0.95f, 0.5f));
                leaf.AddComponent<FloatBobber>().Configure(0.03f, 0.8f, i * 0.4f);
            }
            else
            {
                SetMat(leaf, new Color(0.35f, 0.65f, 0.30f));
            }

            // Recurse
            BuildBranch(parent, tipLocal, branchLen, depth + 1, maxDepth, rng);
        }
    }

    // ─── 3. Sand Time (모래의 시간) ───────────────────────────────

    /// <summary>
    /// Layered sand dunes with wind-swept forms. An hourglass structure at center.
    /// Particle-like small pyramids drift across the surface.
    /// </summary>
    public static GameObject BuildSandTime()
    {
        var root = new GameObject("Cooldown_SandTime");

        // Layered dunes — overlapping flattened spheres
        Vector3[] dunePos = {
            new(-3f, 0f, -1f), new(2f, 0f, -2.5f), new(-1f, 0f, 2.5f),
            new(3.5f, 0f, 1.5f), new(0f, 0f, -0.5f),
        };
        float[] duneSizes = { 3.0f, 2.5f, 2.8f, 2.0f, 3.5f };

        for (int i = 0; i < dunePos.Length; i++)
        {
            var dune = MeshBuilder.CreateIcoSphere($"Dune_{i}", duneSizes[i], 1);
            dune.transform.SetParent(root.transform);
            dune.transform.localPosition = dunePos[i];
            dune.transform.localScale = new Vector3(1f, 0.18f + i * 0.03f, 0.7f);
            dune.transform.localRotation = Quaternion.Euler(0f, i * 31f, 0f);

            float warmth = 0.78f + i * 0.03f;
            SetMat(dune, new Color(warmth, warmth * 0.82f, warmth * 0.55f));
        }

        // Central hourglass structure
        var topCone = MeshBuilder.CreatePyramid("HourglassTop", 6, 0.6f, -1.2f); // inverted
        topCone.transform.SetParent(root.transform);
        topCone.transform.localPosition = new Vector3(0f, 2.0f, 0f);
        SetMat(topCone, new Color(0.65f, 0.55f, 0.38f));

        var bottomCone = MeshBuilder.CreatePyramid("HourglassBottom", 6, 0.6f, 1.2f);
        bottomCone.transform.SetParent(root.transform);
        bottomCone.transform.localPosition = new Vector3(0f, 0.8f, 0f);
        SetMat(bottomCone, new Color(0.70f, 0.60f, 0.42f));

        // Neck — thin cylinder at hourglass center
        var neck = MeshBuilder.CreateFlatCylinder("HourglassNeck", 6, 0.06f, 0.3f);
        neck.transform.SetParent(root.transform);
        neck.transform.localPosition = new Vector3(0f, 1.4f, 0f);
        SetMatUnlit(neck, new Color(0.90f, 0.80f, 0.55f));

        // Sand grain particles — small pyramids scattered across dunes
        var rng = new System.Random(777);
        for (int i = 0; i < 20; i++)
        {
            float angle = (float)(rng.NextDouble() * Mathf.PI * 2f);
            float dist = 1.5f + (float)(rng.NextDouble() * 4f);
            float height = 0.05f + (float)(rng.NextDouble() * 0.15f);

            var grain = MeshBuilder.CreatePyramid($"SandGrain_{i}", 3, 0.04f, 0.06f);
            grain.transform.SetParent(root.transform);
            grain.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * dist, height, Mathf.Sin(angle) * dist
            );
            grain.transform.localRotation = Quaternion.Euler(
                (float)(rng.NextDouble() * 30f), (float)(rng.NextDouble() * 360f), 0f
            );
            SetMat(grain, new Color(0.85f, 0.75f, 0.50f));

            // Gentle drift motion
            grain.AddComponent<FloatBobber>().Configure(0.02f, 0.2f + (float)(rng.NextDouble() * 0.3f), (float)(rng.NextDouble() * 3f));
        }

        // Hourglass slow rotation
        topCone.transform.parent.gameObject.AddComponent<SlowRotator>().speed = 5f;

        return root;
    }

    // ─── Material Helpers ─────────────────────────────────────────

    private static void SetMat(GameObject go, Color color)
    {
        MaterialPool.ApplyToon(go, color);
    }

    private static void SetMatUnlit(GameObject go, Color color)
    {
        MaterialPool.ApplyUnlit(go, color);
    }

    private static void SetMatTransparent(GameObject go, Color color)
    {
        MaterialPool.ApplyToonTransparent(go, color);
    }
}
