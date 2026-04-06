Shader "Unveil/UnveilToonTransparent"
{
    Properties
    {
        _BaseColor ("Base Color", Color) = (0.6, 0.6, 0.7, 0.5)
        _EmissionColor ("Emission Color", Color) = (0, 0, 0, 0)
        _EmissionIntensity ("Emission Intensity", Range(0, 3)) = 0

        [Header(Toon Shading)]
        _ShadowThreshold ("Shadow Threshold", Range(0, 1)) = 0.3
        _ShadowSoftness ("Shadow Softness", Range(0.001, 0.3)) = 0.05
        _ShadowColor ("Shadow Color", Color) = (0.15, 0.12, 0.20, 1.0)

        [Header(Fog)]
        _FogColor ("Fog Color", Color) = (0.06, 0.06, 0.10, 1.0)
        _FogStart ("Fog Start Distance", Float) = 8.0
        _FogEnd ("Fog End Distance", Float) = 25.0
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Transparent"
            "RenderPipeline" = "UniversalPipeline"
            "Queue" = "Transparent"
        }

        Pass
        {
            Name "UnveilToonTransparentForward"
            Tags { "LightMode" = "UniversalForward" }

            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
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
                float3 positionWS  : TEXCOORD1;
            };

            CBUFFER_START(UnityPerMaterial)
                half4  _BaseColor;
                half4  _EmissionColor;
                half   _EmissionIntensity;
                half   _ShadowThreshold;
                half   _ShadowSoftness;
                half4  _ShadowColor;
                half4  _FogColor;
                float  _FogStart;
                float  _FogEnd;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;
                VertexPositionInputs vertexInput = GetVertexPositionInputs(input.positionOS.xyz);
                VertexNormalInputs normalInput = GetVertexNormalInputs(input.normalOS);

                output.positionCS = vertexInput.positionCS;
                output.positionWS = vertexInput.positionWS;
                output.normalWS   = normalInput.normalWS;
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                half3 normalWS = normalize(input.normalWS);
                Light mainLight = GetMainLight();
                half NdotL = dot(normalWS, mainLight.direction);

                half toonStep = smoothstep(
                    _ShadowThreshold - _ShadowSoftness,
                    _ShadowThreshold + _ShadowSoftness,
                    NdotL * 0.5 + 0.5
                );

                half3 litColor = lerp(_ShadowColor.rgb, _BaseColor.rgb, toonStep);
                litColor *= mainLight.color;

                half3 ambient = SampleSH(normalWS) * _BaseColor.rgb * 0.5;
                litColor += ambient;

                half3 emission = _EmissionColor.rgb * _EmissionIntensity;
                litColor += emission;

                float dist = distance(input.positionWS, _WorldSpaceCameraPos);
                half fogAmount = saturate((dist - _FogStart) / (_FogEnd - _FogStart));
                litColor = lerp(litColor, _FogColor.rgb, fogAmount);

                return half4(litColor, _BaseColor.a);
            }
            ENDHLSL
        }
    }

    Fallback "Universal Render Pipeline/Lit"
}
