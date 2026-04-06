// Supabase Edge Function: /assess
// Receives telemetry events from IndexedDB sync, computes BDM-3 dimension scores.
//
// BDM-3 Dimensions:
//   D1 Cognitive Persistence: retry speed, rotation count efficiency
//   D2 Exploratory Curiosity: path diversity, unique blocks touched
//   D3 Frustration Tolerance: backtrack recovery, hesitation patterns

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TelemetryEvent {
  type: string;
  puzzleId: string;
  firstTouchDelay: number;
  rotationCount: number;
  hesitationCount: number;
  backtrackCount: number;
  solveTime: number;
  pathChoice: string;
  completionPath: string;
  ts: number;
}

interface AssessmentResult {
  d1_persistence: number;
  d2_curiosity: number;
  d3_tolerance: number;
  event_count: number;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { events } = await req.json() as { events: TelemetryEvent[] };

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ error: "No events provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Filter to puzzle telemetry events
    const puzzleEvents = events.filter((e) => e.type === "PUZZLE_TELEMETRY");

    if (puzzleEvents.length === 0) {
      return new Response(JSON.stringify({ assessed: false, reason: "no_puzzle_events" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = computeBDM3(puzzleEvents);

    // Store in Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (user) {
      // Store raw events
      const sessionId = crypto.randomUUID();
      await supabase.from("sessions").insert({
        id: sessionId,
        user_id: user.id,
      });

      for (const evt of events) {
        await supabase.from("telemetry_events").insert({
          session_id: sessionId,
          event_type: evt.type,
          puzzle_id: evt.puzzleId ?? "unknown",
          payload: evt,
          client_ts: evt.ts,
        });
      }

      // Store assessment
      await supabase.from("assessments").insert({
        session_id: sessionId,
        user_id: user.id,
        ...result,
      });
    }

    return new Response(JSON.stringify({ assessed: true, ...result }), {
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

function computeBDM3(events: TelemetryEvent[]): AssessmentResult {
  const n = events.length;

  // Aggregate signals across all puzzle events in this session
  let totalRotations = 0;
  let totalHesitations = 0;
  let totalBacktracks = 0;
  let totalSolveTime = 0;
  let totalFirstTouchDelay = 0;
  let uniquePaths = new Set<string>();

  for (const e of events) {
    totalRotations += e.rotationCount;
    totalHesitations += e.hesitationCount;
    totalBacktracks += e.backtrackCount;
    totalSolveTime += e.solveTime;
    totalFirstTouchDelay += e.firstTouchDelay > 0 ? e.firstTouchDelay : 0;
    if (e.pathChoice) uniquePaths.add(e.pathChoice);
  }

  const avgRotations = totalRotations / n;
  const avgHesitations = totalHesitations / n;
  const avgBacktracks = totalBacktracks / n;
  const avgSolveTime = totalSolveTime / n;
  const avgFirstTouch = totalFirstTouchDelay / n;

  // D1 Cognitive Persistence: low first-touch-delay + efficient rotations + fast solve
  // Higher score = more persistent
  const d1 = clamp(
    0.5
    - (avgFirstTouch / 20) * 0.2      // penalty for slow start (up to -0.2)
    + (1 / (1 + avgRotations / 10)) * 0.3  // bonus for efficiency
    + (1 / (1 + avgSolveTime / 60)) * 0.2, // bonus for speed
  );

  // D2 Exploratory Curiosity: path diversity + rotation variety
  // Higher score = more curious
  const pathDiversity = Math.min(uniquePaths.size / n, 1.0);
  const rotationVariety = Math.min(avgRotations / 8, 1.0); // 8 rotations = full exploration
  const d2 = clamp(
    pathDiversity * 0.5 + rotationVariety * 0.3 + 0.2,
  );

  // D3 Frustration Tolerance: low hesitation + low backtrack rate
  // Higher score = more tolerant
  const hesitationRate = avgHesitations / Math.max(avgRotations, 1);
  const backtrackRate = avgBacktracks / Math.max(avgRotations, 1);
  const d3 = clamp(
    0.8
    - hesitationRate * 0.4    // penalty for frequent hesitation
    - backtrackRate * 0.3,    // penalty for frequent backtracking
  );

  return {
    d1_persistence: round3(d1),
    d2_curiosity: round3(d2),
    d3_tolerance: round3(d3),
    event_count: n,
  };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
