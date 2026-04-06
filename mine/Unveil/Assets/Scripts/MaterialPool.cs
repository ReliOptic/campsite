using UnityEngine;

/// <summary>
/// Shared material pool for the Unveil toon rendering pipeline.
/// Instead of creating a new Material per object (80-120 allocations per session),
/// we maintain 3 shared materials and use MaterialPropertyBlock for per-object color.
///
/// Usage:
///   MaterialPool.ApplyToon(renderer, color);
///   MaterialPool.ApplyToonTransparent(renderer, color);
///   MaterialPool.ApplyUnlit(renderer, color);
///   MaterialPool.ApplyToonEmissive(renderer, baseColor, emissionColor, intensity);
/// </summary>
public static class MaterialPool
{
    private static Material _toonOpaque;
    private static Material _toonTransparent;
    private static Material _unlit;

    private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
    private static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");
    private static readonly int EmissionIntensityId = Shader.PropertyToID("_EmissionIntensity");
    private static readonly int ColorId = Shader.PropertyToID("_Color");

    // ─── Shared Materials (lazy init) ────────────────────────────

    private static Material ToonOpaque
    {
        get
        {
            if (_toonOpaque == null)
            {
                Shader shader = Shader.Find("Unveil/UnveilToon");
                if (shader == null)
                {
                    // Fallback if custom shader not yet compiled
                    shader = Shader.Find("Universal Render Pipeline/Lit")
                          ?? Shader.Find("Standard");
                }
                _toonOpaque = new Material(shader);
                _toonOpaque.name = "UnveilToon_Shared_Opaque";
                _toonOpaque.SetFloat("_Smoothness", 0f);
                _toonOpaque.enableInstancing = true;
            }
            return _toonOpaque;
        }
    }

    private static Material ToonTransparent
    {
        get
        {
            if (_toonTransparent == null)
            {
                Shader shader = Shader.Find("Unveil/UnveilToonTransparent");
                if (shader == null)
                {
                    shader = Shader.Find("Universal Render Pipeline/Lit")
                          ?? Shader.Find("Standard");
                }
                _toonTransparent = new Material(shader);
                _toonTransparent.name = "UnveilToon_Shared_Transparent";
                _toonTransparent.enableInstancing = true;
            }
            return _toonTransparent;
        }
    }

    private static Material Unlit
    {
        get
        {
            if (_unlit == null)
            {
                Shader shader = Shader.Find("Universal Render Pipeline/Unlit")
                             ?? Shader.Find("Unlit/Color");
                _unlit = new Material(shader);
                _unlit.name = "UnveilToon_Shared_Unlit";
                _unlit.enableInstancing = true;
            }
            return _unlit;
        }
    }

    // ─── Public API ──────────────────────────────────────────────

    /// <summary>
    /// Apply toon opaque material with per-object base color.
    /// </summary>
    public static void ApplyToon(Renderer renderer, Color color)
    {
        if (renderer == null) return;
        renderer.sharedMaterial = ToonOpaque;

        var mpb = new MaterialPropertyBlock();
        renderer.GetPropertyBlock(mpb);
        mpb.SetColor(BaseColorId, color);
        renderer.SetPropertyBlock(mpb);
    }

    /// <summary>
    /// Apply toon opaque material with emission.
    /// </summary>
    public static void ApplyToonEmissive(Renderer renderer, Color baseColor, Color emissionColor, float intensity)
    {
        if (renderer == null) return;
        renderer.sharedMaterial = ToonOpaque;

        var mpb = new MaterialPropertyBlock();
        renderer.GetPropertyBlock(mpb);
        mpb.SetColor(BaseColorId, baseColor);
        mpb.SetColor(EmissionColorId, emissionColor);
        mpb.SetFloat(EmissionIntensityId, intensity);
        renderer.SetPropertyBlock(mpb);
    }

    /// <summary>
    /// Apply transparent toon material with per-object color (alpha from color.a).
    /// </summary>
    public static void ApplyToonTransparent(Renderer renderer, Color color)
    {
        if (renderer == null) return;
        renderer.sharedMaterial = ToonTransparent;

        var mpb = new MaterialPropertyBlock();
        renderer.GetPropertyBlock(mpb);
        mpb.SetColor(BaseColorId, color);
        renderer.SetPropertyBlock(mpb);
    }

    /// <summary>
    /// Apply unlit material with per-object color. For glowing/emissive elements.
    /// </summary>
    public static void ApplyUnlit(Renderer renderer, Color color)
    {
        if (renderer == null) return;
        renderer.sharedMaterial = Unlit;

        var mpb = new MaterialPropertyBlock();
        renderer.GetPropertyBlock(mpb);
        mpb.SetColor(ColorId, color);
        renderer.SetPropertyBlock(mpb);
    }

    /// <summary>
    /// Apply material to a GameObject's renderer. Convenience wrapper.
    /// </summary>
    public static void ApplyToon(GameObject go, Color color)
    {
        var renderer = go.GetComponent<Renderer>();
        ApplyToon(renderer, color);
    }

    public static void ApplyToonEmissive(GameObject go, Color baseColor, Color emissionColor, float intensity)
    {
        var renderer = go.GetComponent<Renderer>();
        ApplyToonEmissive(renderer, baseColor, emissionColor, intensity);
    }

    public static void ApplyToonTransparent(GameObject go, Color color)
    {
        var renderer = go.GetComponent<Renderer>();
        ApplyToonTransparent(renderer, color);
    }

    public static void ApplyUnlit(GameObject go, Color color)
    {
        var renderer = go.GetComponent<Renderer>();
        ApplyUnlit(renderer, color);
    }
}
