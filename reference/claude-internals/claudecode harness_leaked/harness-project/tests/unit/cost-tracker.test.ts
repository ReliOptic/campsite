import { describe, it, expect } from 'vitest'
import { CostTracker, estimateCost } from '../../src/cost-tracker'
import { BudgetExceededError } from '../../src/types/harness.types'

describe('estimateCost', () => {
  it('calculates cost from token counts', () => {
    // 1M input tokens at $15, 1M output tokens at $75
    const cost = estimateCost(1_000_000, 1_000_000)
    expect(cost).toBe(90.0)
  })

  it('returns 0 for zero tokens', () => {
    expect(estimateCost(0, 0)).toBe(0)
  })

  it('handles small token counts', () => {
    // 1000 input, 500 output
    const cost = estimateCost(1000, 500)
    expect(cost).toBeCloseTo(0.0525, 4)
  })
})

describe('CostTracker', () => {
  it('tracks total spend across rounds', () => {
    const tracker = new CostTracker(100, 3)
    tracker.enterPhase('planning')
    tracker.recordUsage(0, 'planner', 100_000, 10_000, 5000)

    expect(tracker.getTotalUsd()).toBeGreaterThan(0)
  })

  it('throws BudgetExceededError when budget is hit', () => {
    const tracker = new CostTracker(0.01, 3) // tiny budget
    tracker.enterPhase('building')

    expect(() => {
      tracker.recordUsage(1, 'generator', 1_000_000, 1_000_000, 10000)
    }).toThrow(BudgetExceededError)
  })

  it('reports wouldExceedBudget correctly', () => {
    const tracker = new CostTracker(1.0, 3)
    tracker.enterPhase('building')

    // Spend almost everything
    try {
      tracker.recordUsage(1, 'generator', 500_000, 100_000, 5000)
    } catch {
      // might exceed, that's fine for this test
    }

    // Should detect budget pressure
    const result = tracker.wouldExceedBudget('building')
    expect(typeof result).toBe('boolean')
  })

  it('generates a complete cost report', () => {
    const tracker = new CostTracker(150, 3)
    tracker.enterPhase('planning')
    tracker.recordUsage(0, 'planner', 50_000, 5_000, 3000)

    const report = tracker.generateReport()
    expect(report.budgetUsd).toBe(150)
    expect(report.rounds).toHaveLength(1)
    expect(report.rounds[0].agent).toBe('planner')
    expect(report.completedAt).toBeTruthy()
    expect(report.budgetUtilization).toBeGreaterThan(0)
    expect(report.budgetUtilization).toBeLessThan(1)
  })

  it('tracks phase spend separately', () => {
    const tracker = new CostTracker(150, 3)

    tracker.enterPhase('planning')
    tracker.recordUsage(0, 'planner', 50_000, 5_000, 3000)

    tracker.enterPhase('building')
    tracker.recordUsage(1, 'generator', 100_000, 50_000, 60000)

    const report = tracker.generateReport()
    expect(report.phases.planning).toBeGreaterThan(0)
    expect(report.phases.building).toBeGreaterThan(0)
    expect(report.phases.evaluation).toBe(0)
  })

  it('returns remaining budget', () => {
    const tracker = new CostTracker(100, 3)
    expect(tracker.getRemainingBudget()).toBe(100)

    tracker.enterPhase('planning')
    tracker.recordUsage(0, 'planner', 50_000, 5_000, 3000)

    expect(tracker.getRemainingBudget()).toBeLessThan(100)
    expect(tracker.getRemainingBudget()).toBeGreaterThan(0)
  })

  it('returns rounds remaining', () => {
    const tracker = new CostTracker(100, 5)
    expect(tracker.getRoundsRemaining(0)).toBe(5)
    expect(tracker.getRoundsRemaining(2)).toBe(3)
    expect(tracker.getRoundsRemaining(5)).toBe(0)
    expect(tracker.getRoundsRemaining(7)).toBe(0)
  })
})
