// Supabase Edge Function: /coach
// 3-tier LLM coaching pipeline:
//   Tier 1 (Full):     Sonnet, ~1000 tokens, personalized with BDM-3 profile
//   Tier 2 (Light):    Haiku, ~200 tokens, brief encouragement with dimension highlight
//   Tier 3 (Template): No API call, pre-written responses keyed by dominant dimension

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CoachRequest {
  session_id: string;
  tier: "full" | "light" | "template";
  assessment: {
    d1_persistence: number;
    d2_curiosity: number;
    d3_tolerance: number;
  };
  streak_days: number;
  context?: string;
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Template responses (Tier 3, no API cost)
const TEMPLATES: Record<string, string[]> = {
  persistence: [
    "오늘 당신은 꾸준함의 힘을 보여주었습니다. 계단을 하나씩 오르듯, 당신의 인내가 길을 만들어갑니다.",
    "멈추지 않는 것 자체가 용기입니다. 오늘의 걸음이 내일의 발판이 됩니다.",
  ],
  curiosity: [
    "새로운 길을 탐색하는 당신의 호기심이 빛났습니다. 모르는 길에서도 발걸음을 내딛는 것, 그것이 발견의 시작입니다.",
    "당신은 익숙한 길 대신 미지의 경로를 선택했습니다. 그 탐구심이 당신의 가장 큰 자산입니다.",
  ],
  tolerance: [
    "잠시 멈추더라도 다시 시작하는 것, 그것이 진짜 강인함입니다. 오늘 당신은 그 힘을 증명했습니다.",
    "좌절 앞에서도 방향을 바꾸어 다시 나아갔습니다. 그 유연함이 ���신을 더 멀리 데려갈 것입니다.",
  ],
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as CoachRequest;
    const { tier, assessment, streak_days } = body;

    let response: string;
    let model = "none";
    let tokensUsed = 0;

    if (tier === "template") {
      response = getTemplateResponse(assessment);
    } else {
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        // Fallback to template if no API key
        response = getTemplateResponse(assessment);
        model = "template_fallback";
      } else {
        try {
          const result = await callAnthropic(apiKey, tier, assessment, streak_days);
          response = result.text;
          model = result.model;
          tokensUsed = result.tokens;
        } catch {
          // API failure fallback
          response = getTemplateResponse(assessment);
          model = "template_fallback";
        }
      }
    }

    // Store coaching response
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (user && body.session_id) {
      await supabase.from("coaching_responses").insert({
        session_id: body.session_id,
        user_id: user.id,
        tier: tier,
        response_text: response,
        model: model,
        tokens_used: tokensUsed,
      });
    }

    return new Response(JSON.stringify({ response, tier, model }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function getDominantDimension(a: CoachRequest["assessment"]): string {
  if (a.d1_persistence >= a.d2_curiosity && a.d1_persistence >= a.d3_tolerance) return "persistence";
  if (a.d2_curiosity >= a.d3_tolerance) return "curiosity";
  return "tolerance";
}

function getTemplateResponse(assessment: CoachRequest["assessment"]): string {
  const dim = getDominantDimension(assessment);
  const templates = TEMPLATES[dim];
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx];
}

async function callAnthropic(
  apiKey: string,
  tier: "full" | "light",
  assessment: CoachRequest["assessment"],
  streakDays: number,
): Promise<{ text: string; model: string; tokens: number }> {
  const model = tier === "full" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";
  const maxTokens = tier === "full" ? 1000 : 200;
  const dominant = getDominantDimension(assessment);

  const systemPrompt = `You are a contemplative coach in Unveil, a self-discovery puzzle app.
Speak in Korean. Be warm but not saccharine. Use metaphors of stairs, paths, and light.
Never use combat or competition language. Focus on the player's inner journey.
The player's dominant trait today is "${dominant}".
Their streak is ${streakDays} days.`;

  const userPrompt = tier === "full"
    ? `BDM-3 scores: Persistence=${assessment.d1_persistence}, Curiosity=${assessment.d2_curiosity}, Tolerance=${assessment.d3_tolerance}.
Streak: ${streakDays} days.
Write a personalized reflection (3-4 sentences) connecting their puzzle behavior to their inner qualities.`
    : `Dominant: ${dominant}, streak ${streakDays}d. Brief encouragement (1-2 sentences).`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.content[0]?.text ?? "",
    model,
    tokens: data.usage?.output_tokens ?? 0,
  };
}
