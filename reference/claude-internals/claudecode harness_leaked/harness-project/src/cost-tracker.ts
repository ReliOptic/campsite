import type {
  Phase,
  PhaseReservation,
  RoundCost,
  CostReport,
} from './types/harness.types'
import { BudgetExceededError } from './types/harness.types'

const DEFAULT_RESERVATION: PhaseReservation = {
  planning: 0.02,
  building: 0.85,
  evaluation: 0.10,
  reserve: 0.03,
}

// Anthropic pricing (Opus 4.6, per 1M tokens)
const INPUT_COST_PER_MILLION = 15.0
const OUTPUT_COST_PER_MILLION = 75.0

export class CostTracker {
  private readonly rounds: RoundCost[] = []
  private readonly phaseSpend: Record<Phase, number> = {
    planning: 0,
    building: 0,
    evaluation: 0,
  }
  private currentPhase: Phase = 'planning'
  private totalUsd = 0

  constructor(
    private readonly budgetUsd: number,
    private readonly maxRounds: number,
    private readonly reservation: PhaseReservation = DEFAULT_RESERVATION
  ) {}

  enterPhase(phase: Phase): void {
    this.currentPhase = phase
  }

  recordUsage(
    round: number,
    agent: RoundCost['agent'],
    inputTokens: number,
    outputTokens: number,
    durationMs: number
  ): RoundCost {
    const estimatedUsd = estimateCost(inputTokens, outputTokens)

    const cost: RoundCost = {
      round,
      agent,
      inputTokens,
      outputTokens,
      estimatedUsd,
      durationMs,
    }

    this.rounds.push(cost)
    this.phaseSpend[this.currentPhase] += estimatedUsd
    this.totalUsd += estimatedUsd

    if (this.totalUsd >= this.budgetUsd) {
      throw new BudgetExceededError(this.totalUsd, this.budgetUsd, this.generateReport())
    }

    if (this.totalUsd >= this.budgetUsd * 0.8) {
      console.warn(
        `[cost-tracker] Budget 80% reached: $${this.totalUsd.toFixed(2)} / $${this.budgetUsd.toFixed(2)}`
      )
    }

    return cost
  }

  wouldExceedBudget(phase: Phase): boolean {
    const phaseLimit = this.budgetUsd * this.reservation[phase]
    const reserveLimit = this.budgetUsd * (1 - this.reservation.reserve)
    return this.totalUsd >= reserveLimit || this.phaseSpend[phase] >= phaseLimit
  }

  getRemainingBudget(): number {
    return Math.max(0, this.budgetUsd - this.totalUsd)
  }

  getRoundsRemaining(currentRound: number): number {
    return Math.max(0, this.maxRounds - currentRound)
  }

  getTotalUsd(): number {
    return this.totalUsd
  }

  generateReport(): CostReport {
    return {
      totalUsd: this.totalUsd,
      rounds: [...this.rounds],
      budgetUsd: this.budgetUsd,
      budgetUtilization: this.budgetUsd > 0 ? this.totalUsd / this.budgetUsd : 0,
      phases: { ...this.phaseSpend },
      completedAt: new Date().toISOString(),
    }
  }
}

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION
  )
}
