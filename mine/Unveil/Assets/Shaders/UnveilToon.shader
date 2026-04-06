Shader "Unveil/UnveilToon"
{
    Properties
    {
        _BaseColor ("Base Color", Color) = (0.6, 0.6, 0.7, 1.0)
        _EmissionColor ("Emission Color", Color) = (0, 0, 0, 0)
        _EmissionIntensity ("Emission Intensity", Range(0, 3)) = 0

        [Header(Edge Detection)]
        _RimColor ("Rim Color", Color) = (0.2, 0.2, 0.3, 1.0)
        _RimPower ("Rim Power", Range(0.5, 8.0)) = 3.0
        _RimStrength ("Rim Strength", Range(0, 1)) = 0.4

        [Header(Toon Shading)]
        _ShadowThreshold ("Shadow Threshold", Range(0, 1)) = 0.3
        _ShadowSoftness ("Shadow Softness", Range(0.001, 0.3)) = 0.05
        _ShadowColor ("Shadow Color", Color) = (0.15, 0.12, 0.20, 1.0)

        [Header(Fog)]
        _FogColor ("Fog Color", Color) = (0.06, 0.06, 0.10, 1.0)
        _FogStart ("Fog Start Distance", Float) = 8.0
        _FogEnd ("Fog End Distance", Float) = 25.0

        [Header(Transparency)]
        [Toggle] _AlphaClip ("Alpha Clip", Float) = 0
        _Cutoff ("Alpha Cutoff", Range(0, 1)) = 0.5
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Opaque"
            "RenderPipeline" = "UniversalPipeline"
            "Queue" = "Geometry"
        }

        Pass
        {
            Name "UnveilToonForward"
            Tags { "LightMode" = "UniversalForward" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile _ _SHADOWS_SOFT
            #pragma multi_compile_fog
            #pragma shader_feature_local _ALPHACLIP_ON

            // WebGL 2.0 / GLES 3.0 target
            #pragma target 3.0

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
            };

            struct Varyings
            {
                float4 positionCS  : SV_POSITION;
                float3 normalWS    : TEXCOORD0;
                float3 viewDirWS   : TEXCOORD1;
                float3 positionWS  : TEXCOORD2;
                float  fogFactor   : TEXCOORD3;
            };

            // All properties in a CBUFFER for SRP Batcher compatibility.
            // MaterialPropertyBlock can override _BaseColor, _EmissionColor,
            // _EmissionIntensity per-object without breaking batching.
            CBUFFER_START(UnityPerMaterial)
                half4  _BaseColor;
                half4  _EmissionColor;
                half   _EmissionIntensity;
                half4  _RimColor;
                half   _RimPower;
                half   _RimStrength;
                half   _ShadowThreshold;
                half   _ShadowSoftness;
                half4  _ShadowColor;
                half4  _FogColor;
                float  _FogStart;
                float  _FogEnd;
                half   _Cutoff;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;

                VertexPositionInputs vertexInput = GetVertexPositionInputs(input.positionOS.xyz);
                VertexNormalInputs normalInput = GetVertexNormalInputs(input.normalOS);

                output.positionCS = vertexInput.positionCS;
                output.positionWS = vertexInput.positionWS;
                output.normalWS   = normalInput.normalWS;
                output.viewDirWS  = GetWorldSpaceNormalizeViewDir(vertexInput.positionWS);
                output.fogFactor  = ComputeFogFactor(vertexInput.positionCS.z);

                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                // Normalize interpolated vectors
                half3 normalWS = normalize(input.normalWS);
                half3 viewDirWS = normalize(input.viewDirWS);

                // Main directional light
                Light mainLight = GetMainLight();
                half NdotL = dot(normalWS, mainLight.direction);

                // Toon step: hard shadow with slight softness
                half toonStep = smoothstep(
                    _ShadowThreshold - _ShadowSoftness,
                    _ShadowThreshold + _ShadowSoftness,
                    NdotL * 0.5 + 0.5
                );

                // Blend base color with shadow
                half3 litColor = lerp(_ShadowColor.rgb, _BaseColor.rgb, toonStep);

                // Apply light color (tinted by directional light)
                litColor *= mainLight.color;

                // Ambient contribution
                half3 ambient = SampleSH(normalWS) * _BaseColor.rgb * 0.5;
                litColor += ambient;

                // Fresnel rim (edge detection substitute for flat-shaded geometry)
                half fresnel = 1.0 - saturate(dot(normalWS, viewDirWS));
                half rim = pow(fresnel, _RimPower) * _RimStrength;
                litColor = lerp(litColor, _RimColor.rgb, rim);

                // Emission
                half3 emission = _EmissionColor.rgb * _EmissionIntensity;
                litColor += emission;

                // Distance fog (camera-relative, not Unity fog)
                float dist = distance(input.positionWS, _WorldSpaceCameraPos);
                half fogAmount = saturate((dist - _FogStart) / (_FogEnd - _FogStart));
                litColor = lerp(litColor, _FogColor.rgb, fogAmount);

                half alpha = _BaseColor.a;

                #ifdef _ALPHACLIP_ON
                    clip(alpha - _Cutoff);
                #endif

                return half4(litColor, alpha);
            }
            ENDHLSL
        }

        // Shadow caster pass for receiving shadows from other objects
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }

            ZWrite On
            ZTest LEqual
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex ShadowPassVertex
            #pragma fragment ShadowPassFragment
            #pragma target 3.0

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
            };

            float3 _LightDirection;

            Varyings ShadowPassVertex(Attributes input)
            {
                Varyings output;

                float3 positionWS = TransformObjectToWorld(input.positionOS.xyz);
                float3 normalWS = TransformObjectToWorldNormal(input.normalOS);

                // Apply shadow bias
                positionWS = ApplyShadowBias(positionWS, normalWS, _LightDirection);
                output.positionCS = TransformWorldToHClip(positionWS);

                #if UNITY_REVERSED_Z
                    output.positionCS.z = min(output.positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #else
                    output.positionCS.z = max(output.positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #endif

                return output;
            }

            half4 ShadowPassFragment(Varyings input) : SV_Target
            {
                return 0;
            }
            ENDHLSL
        }

        // Depth-only pass for depth prepass
        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }

            ZWrite On
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex DepthOnlyVertex
            #pragma fragment DepthOnlyFragment
            #pragma target 3.0

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
            };

            Varyings DepthOnlyVertex(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                return output;
            }

            half4 DepthOnlyFragment(Varyings input) : SV_Target
            {
                return 0;
            }
            ENDHLSL
        }
    }

    Fallback "Universal Render Pipeline/Lit"
}
