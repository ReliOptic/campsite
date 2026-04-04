import type { ProductSpec } from '../schemas/spec.schema'
import type { Evaluation } from '../schemas/evaluation.schema'

export type { ProductSpec } from '../schemas/spec.schema'
export type { Handoff } from '../schemas/handoff.schema'
export type { Evaluation } from '../schemas/evaluation.schema'
export type { AcceptanceContract } from '../schemas/contract.schema'

export interface HarnessConfig {
  readonly prompt: string
  readonly preset: string
  readonly model: string
  readonly budgetUsd: number
  readonly maxRounds: number
  readonly outputDir: string
  readonly evaluation: EvaluationThresholds
  readonly features: FeatureFlags
}

export interface EvaluationThresholds {
  readonly designQuality: number
  readonly originality: number
  readonly craft: number
  readonly functionality: number
  readonly plateau: number
}

export interface FeatureFlags {
  readonly planner: boolean
  readonly designEvaluation: boolean
  readonly aiWeaving: boolean
  readonly contractGeneration: boolean
}

export interface PhaseReservation {
  readonly planning: number
  readonly building: number
  readonly evaluation: number
  readonly reserve: number
}

export interface RoundCost {
  readonly round: number
  readonly agent: 'planner' | 'generator' | 'evaluator'
  readonly inputTokens: number
  readonly outputTokens: number
  readonly estimatedUsd: number
  readonly durationMs: number
}

export interface CostReport {
  readonly totalUsd: number
  readonly rounds: RoundCost[]
  readonly budgetUsd: number
  readonly budgetUtilization: number
  readonly phases: Record<string, number>
  readonly completedAt: string
}

export type Phase = 'planning' | 'building' | 'evaluation'
export type Verdict = 'PASS' | 'FAIL' | 'PARTIAL'
export type StrategicDirection = 'REFINE' | 'PIVOT'
export type Severity = 'critical' | 'high' | 'medium'
export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface HarnessResult {
  readonly spec: ProductSpec
  readonly evaluations: Evaluation[]
  readonly report: CostReport
}

export class BudgetExceededError extends Error {
  constructor(
    public readonly spent: number,
    public readonly budget: number,
    public readonly report: CostReport
  ) {
    super(`Budget exceeded: $${spent.toFixed(2)} / $${budget.toFixed(2)}`)
    this.name = 'BudgetExceededError'
  }
}

export class SchemaValidationError extends Error {
  constructor(
    public readonly agent: string,
    public readonly errors: string[]
  ) {
    super(`${agent} output failed schema validation: ${errors.join(', ')}`)
    this.name = 'SchemaValidationError'
  }
}

export class AgentExecutionError extends Error {
  constructor(
    public readonly agent: string,
    public readonly phase: Phase,
    public readonly cause: unknown
  ) {
    super(`${agent} failed during ${phase}: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'AgentExecutionError'
  }
}
