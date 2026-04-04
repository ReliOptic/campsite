import { describe, it, expect } from 'vitest'
import { isPlateauing } from '../../src/orchestrator'
import type { Evaluation } from '../../src/schemas/evaluation.schema'

function makeEvaluation(scores: {
  design_quality: number
  originality: number
  craft: number
  functionality: number
}): Evaluation {
  return {
    round: 1,
    verdict: 'PARTIAL',
    scores,
    threshold_failures: [],
    findings: [],
    strategic_direction: 'REFINE',
    direction_rationale: 'test',
  }
}

describe('isPlateauing', () => {
  it('returns false with fewer than 2 evaluations', () => {
    expect(isPlateauing([])).toBe(false)
    expect(isPlateauing([makeEvaluation({ design_quality: 5, originality: 5, craft: 5, functionality: 5 })])).toBe(false)
  })

  it('returns true when score improvement is below threshold', () => {
    const history = [
      makeEvaluation({ design_quality: 7, originality: 7, craft: 7, functionality: 7 }),
      makeEvaluation({ design_quality: 7.1, originality: 7.1, craft: 7.1, functionality: 7.1 }),
    ]
    expect(isPlateauing(history, 0.5)).toBe(true)
  })

  it('returns false when scores are improving significantly', () => {
    const history = [
      makeEvaluation({ design_quality: 5, originality: 5, craft: 5, functionality: 5 }),
      makeEvaluation({ design_quality: 7, originality: 7, craft: 7, functionality: 7 }),
    ]
    expect(isPlateauing(history, 0.5)).toBe(false)
  })

  it('returns true when scores are declining', () => {
    const history = [
      makeEvaluation({ design_quality: 8, originality: 8, craft: 8, functionality: 8 }),
      makeEvaluation({ design_quality: 7, originality: 7, craft: 7, functionality: 7 }),
    ]
    // Decline means (avg_last - avg_prev) < threshold, which is negative < 0.5
    expect(isPlateauing(history, 0.5)).toBe(true)
  })

  it('uses default threshold of 0.5', () => {
    const history = [
      makeEvaluation({ design_quality: 7, originality: 7, craft: 7, functionality: 7 }),
      makeEvaluation({ design_quality: 7.3, originality: 7.3, craft: 7.3, functionality: 7.3 }),
    ]
    expect(isPlateauing(history)).toBe(true)
  })

  it('only compares last two evaluations', () => {
    const history = [
      makeEvaluation({ design_quality: 3, originality: 3, craft: 3, functionality: 3 }),
      makeEvaluation({ design_quality: 5, originality: 5, craft: 5, functionality: 5 }),
      makeEvaluation({ design_quality: 8, originality: 8, craft: 8, functionality: 8 }),
      makeEvaluation({ design_quality: 8.1, originality: 8.1, craft: 8.1, functionality: 8.1 }),
    ]
    // Only last two matter: 8 vs 8.1 = plateau
    expect(isPlateauing(history, 0.5)).toBe(true)
  })
})
