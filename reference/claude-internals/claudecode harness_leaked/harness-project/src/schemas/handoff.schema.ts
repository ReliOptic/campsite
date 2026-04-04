import { z } from 'zod'

export const handoffSchema = z.object({
  round: z.number().int().positive(),
  verdict: z.enum(['PASS', 'FAIL', 'PARTIAL']),
  scores: z.object({
    design_quality: z.number().min(1).max(10),
    originality: z.number().min(1).max(10),
    craft: z.number().min(1).max(10),
    functionality: z.number().min(1).max(10),
  }),
  thresholds_met: z.boolean(),
  must_fix: z.array(z.object({
    id: z.string(),
    description: z.string(),
    severity: z.enum(['critical', 'high', 'medium']),
  })),
  preserve: z.array(z.object({
    id: z.string(),
    description: z.string(),
  })),
  strategic_direction: z.enum(['REFINE', 'PIVOT']),
  direction_rationale: z.string(),
  cost_so_far: z.object({
    total_usd: z.number(),
    rounds_remaining: z.number().int(),
    budget_remaining_usd: z.number(),
  }),
})

export type Handoff = z.infer<typeof handoffSchema>
