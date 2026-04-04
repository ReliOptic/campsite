import { z } from 'zod'

export const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium']),
  category: z.enum(['design', 'functionality', 'performance', 'accessibility']),
  description: z.string(),
  location: z.string(),
  evidence: z.string(),
})

export const evaluationSchema = z.object({
  round: z.number().int().positive(),
  verdict: z.enum(['PASS', 'FAIL', 'PARTIAL']),
  scores: z.object({
    design_quality: z.number().min(1).max(10),
    originality: z.number().min(1).max(10),
    craft: z.number().min(1).max(10),
    functionality: z.number().min(1).max(10),
  }),
  threshold_failures: z.array(z.string()),
  findings: z.array(findingSchema),
  strategic_direction: z.enum(['REFINE', 'PIVOT']),
  direction_rationale: z.string(),
})

export type Evaluation = z.infer<typeof evaluationSchema>
export type Finding = z.infer<typeof findingSchema>
