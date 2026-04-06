using UnityEngine;

/// <summary>
/// Generates Monument Valley-style flat-shaded low-poly geometry for mood worlds
/// and threshold structures. All geometry is procedural via MeshBuilder — no texture
/// assets, no prefabs, no editor setup required. Uses contemplative exploration metaphors.
/// </summary>
public static class ProceduralWorldBuilder
{
    // ─── Mood World Factories ───────────────────────────────────────

    public static GameObject BuildCalmWorld()
    {
        var root = new GameObject("MoodWorld_Calm");

        // Hexagonal platform — soft teal
        var platform = MeshBuilder.CreateFlatCylinder("Platform", 6, 6f, 0.3f);
        platform.transform.SetParent(root.transform);
        SetMaterial(platform, new Color(0.55f, 0.78f, 0.82f));

        // Zen pillars — hexagonal columns in circular arrangement
        float[] heights = { 2.0f, 3.2f, 1.5f, 2.8f, 1.8f, 3.5f, 2.3f };
        float radius = 3.5f;
        for (int i = 0; i < heights.Length; i++)
        {
            float angle = i * Mathf.PI * 2f / heights.Length;
            var pillar = MeshBuilder.CreateFlatCylinder($"Pillar_{i}", 6, 0.35f, heights[i]);
            pillar.transform.SetParent(root.transform);
            pillar.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * radius, heights[i] * 0.5f, Mathf.Sin(angle) * radius
            );
            float hue = 0.52f + i * 0.01f;
            SetMaterial(pillar, Color.HSVToRGB(hue, 0.25f, 0.85f));
        }

        // Faceted center orb
        var orb = MeshBuilder.CreateIcoSphere("CenterOrb", 0.6f, 1);
        orb.transform.SetParent(root.transform);
        orb.transform.localPosition = new Vector3(0f, 1.2f, 0f);
        SetMaterial(orb, new Color(0.75f, 0.92f, 0.95f, 0.8f), transparent: true);
        orb.AddComponent<FloatBobber>().Configure(0.15f, 0.4f, 0f);

        // Stepped pyramids — single merged meshes
        for (int i = 0; i < 3; i++)
        {
            float a = i * Mathf.PI * 2f / 3f + 0.5f;
            var pyramid = MeshBuilder.CreateSteppedPyramidMesh($"StepPyramid_{i}", 3, 0.8f, 0.4f);
            pyramid.transform.SetParent(root.transform);
            pyramid.transform.localPosition = new Vector3(
                Mathf.Cos(a) * 1.5f, 0.3f, Mathf.Sin(a) * 1.5f
            );
            SetMaterial(pyramid, new Color(0.60f, 0.82f, 0.78f));
        }

        // Lighthouse structure (inspired by scene reference)
        var lighthouseBase = MeshBuilder.CreateFlatCylinder("LighthouseBase", 6, 0.4f, 2.5f);
        lighthouseBase.transform.SetParent(root.transform);
        lighthouseBase.transform.localPosition = new Vector3(-2.5f, 1.25f, -2.5f);
        SetMaterial(lighthouseBase, new Color(0.70f, 0.85f, 0.88f));

        var lighthouseTop = MeshBuilder.CreatePyramid("LighthouseTop", 6, 0.5f, 0.8f);
        lighthouseTop.transform.SetParent(root.transform);
        lighthouseTop.transform.localPosition = new Vector3(-2.5f, 2.5f, -2.5f);
        SetMaterial(lighthouseTop, new Color(0.80f, 0.90f, 0.92f));

        var beacon = MeshBuilder.CreateIcoSphere("Beacon", 0.15f, 0);
        beacon.transform.SetParent(root.transform);
        beacon.transform.localPosition = new Vector3(-2.5f, 3.0f, -2.5f);
        SetMaterialUnlit(beacon, new Color(0.9f, 0.95f, 1.0f));

        return root;
    }

    public static GameObject BuildHeavyWorld()
    {
        var root = new GameObject("MoodWorld_Heavy");

        // Ground — dark purple slab
        var platform = MeshBuilder.CreateFlatBox("Platform", 10f, 0.4f, 10f);
        platform.transform.SetParent(root.transform);
        platform.transform.localPosition = new Vector3(0f, -0.2f, 0f);
        SetMaterial(platform, new Color(0.22f, 0.14f, 0.30f));

        // Dense angular ruins
        Vector3[] blockPos = {
            new(-2f, 0.8f, -1f), new(1.5f, 1.2f, 0.5f), new(-0.5f, 0.5f, 2f),
            new(2.5f, 0.6f, -2f), new(-1.5f, 1.5f, 1.5f), new(0f, 0.4f, -2.5f),
            new(3f, 0.3f, 1f), new(-2.5f, 0.7f, -2.5f), new(1f, 1.0f, -1.5f),
        };
        Vector3[] blockScales = {
            new(1.2f, 1.6f, 0.8f), new(0.7f, 2.4f, 1.0f), new(1.5f, 1.0f, 0.6f),
            new(0.8f, 1.2f, 1.4f), new(0.6f, 3.0f, 0.5f), new(1.0f, 0.8f, 1.0f),
            new(0.5f, 0.6f, 0.8f), new(1.3f, 1.4f, 0.7f), new(0.9f, 2.0f, 0.9f),
        };
        for (int i = 0; i < blockPos.Length; i++)
        {
            var block = MeshBuilder.CreateFlatBox($"Ruin_{i}", blockScales[i].x, blockScales[i].y, blockScales[i].z);
            block.transform.SetParent(root.transform);
            block.transform.localPosition = blockPos[i];
            block.transform.localRotation = Quaternion.Euler(0f, i * 23f, 0f);
            float shade = 0.20f + i * 0.03f;
            SetMaterial(block, new Color(shade + 0.10f, shade, shade + 0.15f));
        }

        // Inverted pyramid stalactites
        for (int i = 0; i < 3; i++)
        {
            float a = i * Mathf.PI * 2f / 3f;
            var stalactite = MeshBuilder.CreatePyramid($"Stalactite_{i}", 4, 0.3f, -1.2f);
            stalactite.transform.SetParent(root.transform);
            stalactite.transform.localPosition = new Vector3(
                Mathf.Cos(a) * 2f, 4.5f, Mathf.Sin(a) * 2f
            );
            SetMaterial(stalactite, new Color(0.30f, 0.20f, 0.40f));
        }

        // Hanging slab with gentle float
        var slab = MeshBuilder.CreateFlatBox("HangingSlab", 3f, 0.3f, 2f);
        slab.transform.SetParent(root.transform);
        slab.transform.localPosition = new Vector3(0f, 4f, 0f);
        slab.transform.localRotation = Quaternion.Euler(5f, 15f, -3f);
        SetMaterial(slab, new Color(0.35f, 0.25f, 0.45f));
        slab.AddComponent<FloatBobber>().Configure(0.08f, 0.25f, 0.5f);

        return root;
    }

    public static GameObject BuildRestlessWorld()
    {
        var root = new GameObject("MoodWorld_Restless");
        // Seeded random for deterministic generation
        var rng = new System.Random(42);

        // Ground — warm amber octagonal platform
        var platform = MeshBuilder.CreateFlatCylinder("Platform", 8, 5.5f, 0.25f);
        platform.transform.SetParent(root.transform);
        platform.transform.localPosition = Vector3.zero;
        SetMaterial(platform, new Color(0.45f, 0.28f, 0.15f));

        // Pointed pyramid shards — volcanic spikes
        for (int i = 0; i < 10; i++)
        {
            float offset = (float)(rng.NextDouble() * 0.4 - 0.2);
            float angle = i * Mathf.PI * 2f / 10f + offset;
            float dist = 2f + i * 0.3f;
            float height = 1.0f + i * 0.35f;

            var shard = MeshBuilder.CreatePyramid($"Shard_{i}", 4, 0.15f + i * 0.02f, height);
            shard.transform.SetParent(root.transform);
            shard.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * dist, height * 0.3f, Mathf.Sin(angle) * dist
            );
            float tilt = 15f + i * 3f;
            shard.transform.localRotation = Quaternion.Euler(-tilt, angle * Mathf.Rad2Deg, 0f);

            float warmth = 0.6f + i * 0.03f;
            SetMaterial(shard, new Color(warmth, warmth * 0.55f, warmth * 0.25f));
        }

        // Faceted lava core — glowing warm
        var core = MeshBuilder.CreateIcoSphere("LavaCore", 0.8f, 1);
        core.transform.SetParent(root.transform);
        core.transform.localPosition = new Vector3(0f, 1.5f, 0f);
        SetMaterialUnlit(core, new Color(1f, 0.45f, 0.15f));
        core.AddComponent<FloatBobber>().Configure(0.1f, 0.6f, 0f);

        return root;
    }

    public static GameObject BuildDriftWorld()
    {
        var root = new GameObject("MoodWorld_Drift");

        // Floating islands — single-mesh each (1 draw call instead of 4)
        Vector3[] islandPos = {
            new(0f, 0f, 0f), new(3f, 1.5f, 2f), new(-2.5f, 2.5f, 1f),
            new(1.5f, 3.5f, -2f), new(-1f, 1.0f, -3f), new(4f, 0.5f, -1f),
            new(-3.5f, 4f, -0.5f),
        };
        float[] islandSizes = { 2.5f, 1.5f, 1.8f, 1.2f, 1.6f, 1.0f, 0.8f };

        for (int i = 0; i < islandPos.Length; i++)
        {
            var island = MeshBuilder.CreateFloatingIslandMesh($"Island_{i}", islandSizes[i]);
            island.transform.SetParent(root.transform);
            island.transform.localPosition = islandPos[i];
            island.transform.localRotation = Quaternion.Euler(0f, i * 37f, 0f);

            float green = 0.55f + i * 0.04f;
            SetMaterial(island, new Color(green * 0.7f, green, green * 0.7f));
            island.AddComponent<FloatBobber>().Configure(0.12f, 0.3f + i * 0.05f, i * 0.7f);

            // Tree details on larger islands
            if (islandSizes[i] > 1.2f)
            {
                var trunk = MeshBuilder.CreateFlatBox("Trunk", 0.1f, 0.4f, 0.1f);
                trunk.transform.SetParent(island.transform);
                trunk.transform.localPosition = new Vector3(islandSizes[i] * 0.15f, 0.28f, 0f);
                SetMaterial(trunk, new Color(0.3f, 0.55f, 0.3f));

                var canopy = MeshBuilder.CreateIcoSphere("Canopy", 0.18f, 0);
                canopy.transform.SetParent(island.transform);
                canopy.transform.localPosition = new Vector3(islandSizes[i] * 0.15f, 0.55f, 0f);
                SetMaterial(canopy, new Color(0.4f, 0.7f, 0.4f));
            }
        }

        // Connecting bridge
        var bridge = MeshBuilder.CreateFlatBox("Bridge_0", 0.12f, 0.06f, 2.5f);
        bridge.transform.SetParent(root.transform);
        bridge.transform.localPosition = new Vector3(1.5f, 0.75f, 1f);
        bridge.transform.localRotation = Quaternion.Euler(10f, 35f, 0f);
        SetMaterial(bridge, new Color(0.65f, 0.80f, 0.65f));

        return root;
    }

    // ─── Agora (5th Realm — Relationships, Warm Complexity) ────────

    public static GameObject BuildAgoraWorld()
    {
        var root = new GameObject("MoodWorld_Agora");

        // Radial gravity plaza — large terracotta octagonal base
        var plaza = MeshBuilder.CreateFlatCylinder("Plaza", 8, 7f, 0.2f);
        plaza.transform.SetParent(root.transform);
        plaza.transform.localPosition = Vector3.zero;
        SetMaterial(plaza, new Color(0.72f, 0.45f, 0.32f)); // terracotta

        // Concentric ring tiers — Byzantine radial symmetry
        float[] ringRadii = { 5.5f, 4.0f, 2.5f };
        float[] ringHeights = { 0.15f, 0.3f, 0.5f };
        for (int i = 0; i < ringRadii.Length; i++)
        {
            var ring = MeshBuilder.CreateFlatCylinder($"Ring_{i}", 8, ringRadii[i], ringHeights[i]);
            ring.transform.SetParent(root.transform);
            ring.transform.localPosition = new Vector3(0f, ringHeights[i] * 0.5f + 0.2f, 0f);
            float warmth = 0.75f + i * 0.05f;
            SetMaterial(ring, new Color(warmth, warmth * 0.65f, warmth * 0.50f));
        }

        // Moorish arches — pointed arch pairs around perimeter
        int archCount = 6;
        for (int i = 0; i < archCount; i++)
        {
            float angle = i * Mathf.PI * 2f / archCount;
            float dist = 5.0f;
            Vector3 archPos = new Vector3(Mathf.Cos(angle) * dist, 0f, Mathf.Sin(angle) * dist);

            // Left pillar
            var pillarL = MeshBuilder.CreateFlatCylinder($"ArchPillarL_{i}", 6, 0.18f, 2.5f);
            pillarL.transform.SetParent(root.transform);
            pillarL.transform.localPosition = archPos + new Vector3(-0.4f, 1.25f, 0f);
            SetMaterial(pillarL, new Color(0.82f, 0.55f, 0.40f));

            // Right pillar
            var pillarR = MeshBuilder.CreateFlatCylinder($"ArchPillarR_{i}", 6, 0.18f, 2.5f);
            pillarR.transform.SetParent(root.transform);
            pillarR.transform.localPosition = archPos + new Vector3(0.4f, 1.25f, 0f);
            SetMaterial(pillarR, new Color(0.82f, 0.55f, 0.40f));

            // Arch top — pointed pyramid (Moorish keystone)
            var archTop = MeshBuilder.CreatePyramid($"ArchTop_{i}", 4, 0.5f, 0.8f);
            archTop.transform.SetParent(root.transform);
            archTop.transform.localPosition = archPos + new Vector3(0f, 2.5f, 0f);
            archTop.transform.localRotation = Quaternion.Euler(0f, angle * Mathf.Rad2Deg + 45f, 0f);
            SetMaterial(archTop, new Color(0.88f, 0.62f, 0.45f));

            // Lintel connecting pillars
            var lintel = MeshBuilder.CreateFlatBox($"Lintel_{i}", 0.9f, 0.15f, 0.25f);
            lintel.transform.SetParent(root.transform);
            lintel.transform.localPosition = archPos + new Vector3(0f, 2.45f, 0f);
            lintel.transform.localRotation = Quaternion.Euler(0f, angle * Mathf.Rad2Deg, 0f);
            SetMaterial(lintel, new Color(0.78f, 0.50f, 0.38f));
        }

        // Central gathering structure — stepped dome (Byzantine)
        var domeBase = MeshBuilder.CreateFlatCylinder("DomeBase", 8, 1.2f, 0.6f);
        domeBase.transform.SetParent(root.transform);
        domeBase.transform.localPosition = new Vector3(0f, 0.8f, 0f);
        SetMaterial(domeBase, new Color(0.85f, 0.60f, 0.48f));

        var dome = MeshBuilder.CreateIcoSphere("Dome", 1.0f, 1);
        dome.transform.SetParent(root.transform);
        dome.transform.localPosition = new Vector3(0f, 1.5f, 0f);
        dome.transform.localScale = new Vector3(1f, 0.6f, 1f); // flattened dome
        SetMaterial(dome, new Color(0.90f, 0.68f, 0.55f));

        // Rose-tinted light orb at dome apex
        var roseOrb = MeshBuilder.CreateIcoSphere("RoseOrb", 0.2f, 0);
        roseOrb.transform.SetParent(root.transform);
        roseOrb.transform.localPosition = new Vector3(0f, 2.2f, 0f);
        SetMaterialUnlit(roseOrb, new Color(1f, 0.70f, 0.65f));
        roseOrb.AddComponent<FloatBobber>().Configure(0.08f, 0.5f, 0f);

        // Scattered seating blocks — warm gathering spots
        float[] seatAngles = { 0.3f, 1.1f, 2.0f, 2.8f, 3.7f, 4.5f, 5.3f };
        for (int i = 0; i < seatAngles.Length; i++)
        {
            float a = seatAngles[i];
            float d = 3.0f + (i % 3) * 0.5f;
            var seat = MeshBuilder.CreateFlatBox($"Seat_{i}", 0.5f, 0.35f, 0.5f);
            seat.transform.SetParent(root.transform);
            seat.transform.localPosition = new Vector3(
                Mathf.Cos(a) * d, 0.375f, Mathf.Sin(a) * d
            );
            seat.transform.localRotation = Quaternion.Euler(0f, a * Mathf.Rad2Deg, 0f);
            float rose = 0.70f + i * 0.02f;
            SetMaterial(seat, new Color(rose, rose * 0.70f, rose * 0.65f));
        }

        return root;
    }

    // ─── Threshold Structure (formerly BossOrb) ─────────────────────

    public static GameObject BuildThresholdStructure()
    {
        var root = new GameObject("ThresholdStructure");

        // Core sphere — faceted mysterious orb
        var core = MeshBuilder.CreateIcoSphere("Core", 0.7f, 2);
        core.transform.SetParent(root.transform);
        core.transform.localPosition = new Vector3(0f, 3f, 0f);
        SetMaterial(core, new Color(0.15f, 0.08f, 0.20f),
            emission: new Color(0.4f, 0.15f, 0.5f));

        // Orbiting diamond fragments
        var fragmentRing = new GameObject("FragmentRing");
        fragmentRing.transform.SetParent(core.transform);
        fragmentRing.transform.localPosition = Vector3.zero;

        for (int i = 0; i < 6; i++)
        {
            float angle = i * Mathf.PI * 2f / 6f;
            var fragment = MeshBuilder.CreatePyramid($"Fragment_{i}", 4, 0.15f, 0.3f);
            fragment.transform.SetParent(fragmentRing.transform);
            fragment.transform.localPosition = new Vector3(
                Mathf.Cos(angle) * 1.2f, 0f, Mathf.Sin(angle) * 1.2f
            );
            fragment.transform.localRotation = Quaternion.Euler(45f, angle * Mathf.Rad2Deg, 45f);
            SetMaterial(fragment, new Color(0.50f, 0.25f, 0.60f, 0.7f), transparent: true);
        }

        // Core rotates slowly
        core.AddComponent<SlowRotator>().speed = 15f;
        // Fragment ring orbits
        fragmentRing.AddComponent<OrbitRotator>().Configure(12f, 0.08f, 0.5f);

        return root;
    }

    // ─── Material Helpers ───────────────────────────────────────────

    private static void SetMaterial(GameObject go, Color color, bool transparent = false, Color? emission = null)
    {
        if (transparent)
        {
            MaterialPool.ApplyToonTransparent(go, color);
        }
        else if (emission.HasValue)
        {
            MaterialPool.ApplyToonEmissive(go, color, emission.Value, 1f);
        }
        else
        {
            MaterialPool.ApplyToon(go, color);
        }
    }

    private static void SetMaterialUnlit(GameObject go, Color color)
    {
        MaterialPool.ApplyUnlit(go, color);
    }

    public static void SetMaterialRecursive(GameObject go, Color color)
    {
        foreach (var renderer in go.GetComponentsInChildren<Renderer>())
        {
            MaterialPool.ApplyToon(renderer, color);
        }
    }
}
