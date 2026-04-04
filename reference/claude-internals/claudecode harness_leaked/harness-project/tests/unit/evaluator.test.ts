import { describe, it, expect } from 'vitest'
import { evaluationSchema } from '../../src/schemas/evaluation.schema'
import { handoffSchema } from '../../src/schemas/handoff.schema'

describe('evaluationSchema', () => {
  it('validates a correct evaluation', () => {
    const valid = {
      round: 1,
      verdict: 'PARTIAL',
      scores: {
        design_quality: 7,
        originality: 5,
        craft: 8,
        functionality: 9,
      },
      threshold_failures: ['originality'],
      findings: [
        {
          id: 'F1',
          severity: 'high',
          category: 'design',
          description: 'Hero section uses stock gradient',
          location: 'src/components/Hero.tsx',
          evidence: 'Screenshot shows default purple-to-blue gradient',
        },
      ],
      strategic_direction: 'PIVOT',
      direction_rationale: 'Current aesthetic reads as AI-generated',
    }

    const result = evaluationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects scores outside 1-10 range', () => {
    const invalid = {
      round: 1,
      verdict: 'PASS',
      scores: {
        design_quality: 11,
        originality: 5,
        craft: 8,
        functionality: 0,
      },
      threshold_failures: [],
      findings: [],
      strategic_direction: 'REFINE',
      direction_rationale: 'test',
    }

    const result = evaluationSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects invalid verdict values', () => {
    const invalid = {
      round: 1,
      verdict: 'MAYBE',
      scores: { design_quality: 7, originality: 7, craft: 7, functionality: 7 },
      threshold_failures: [],
      findings: [],
      strategic_direction: 'REFINE',
      direction_rationale: 'test',
    }

    const result = evaluationSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('handoffSchema', () => {
  it('validates a correct handoff', () => {
    const valid = {
      round: 2,
      verdict: 'PARTIAL',
      scores: { design_quality: 7, originality: 5, craft: 8, functionality: 9 },
      thresholds_met: false,
      must_fix: [
        { id: 'F1', description: 'Fix hero gradient', severity: 'high' },
      ],
      preserve: [
        { id: 'P1', description: 'Auth flow works end-to-end' },
      ],
      strategic_direction: 'PIVOT',
      direction_rationale: 'Purple gradient reads as AI-generated',
      cost_so_far: {
        total_usd: 74.32,
        rounds_remaining: 1,
        budget_remaining_usd: 75.68,
      },
    }

    const result = handoffSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects negative round numbers', () => {
    const invalid = {
      round: -1,
      verdict: 'FAIL',
      scores: { design_quality: 3, originality: 3, craft: 3, functionality: 3 },
      thresholds_met: false,
      must_fix: [],
      preserve: [],
      strategic_direction: 'PIVOT',
      direction_rationale: 'test',
      cost_so_far: { total_usd: 0, rounds_remaining: 3, budget_remaining_usd: 150 },
    }

    const result = handoffSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
