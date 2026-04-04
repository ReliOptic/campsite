import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CostTracker } from './cost-tracker'
import { runPlanner } from './agents/planner'
import { runGenerator } from './agents/generator'
import { runEvaluator } from './agents/evaluator'
import { handoffSchema } from './schemas/handoff.schema'
import type { Handoff } from './schemas/handoff.schema'
import type { Evaluation } from './schemas/evaluation.schema'
import type { ProductSpec } from './schemas/spec.schema'
import type { AcceptanceContract } from './schemas/contract.schema'
import type {
  HarnessConfig,
  HarnessResult,
  CostReport,
} from './types/harness.types'
import { BudgetExceededError } from './types/harness.types'

export async function runHarness(config: HarnessConfig): Promise<HarnessResult> {
  const tracker = new CostTracker(config.budgetUsd, config.maxRounds)
  const evaluations: Evaluation[] = []

  // Phase 1: Planning
  console.log('[harness] Phase 1: Planning')
  tracker.enterPhase('planning')

  let spec: ProductSpec
  if (config.features.planner) {
    spec = await runPlannerWithRetry(config, tracker)
  } else {
    throw new Error('Planner disabled but no spec provided. Enable planner or provide a spec.')
  }

  console.log(`[harness] Spec generated: ${spec.features.length} features`)

  // Phase 2: Contract generation
  const contract = generateContract(spec)
  console.log(`[harness] Contract: ${contract.criteria.length} acceptance criteria`)

  // Phase 3: Build-QA Loop
  let round = 0
  let handoff: Handoff | undefined

  while (round < config.maxRounds) {
    round++
    console.log(`\n[harness] === Round ${round}/${config.maxRounds} ===`)

    // Generator
    console.log(`[harness] Building...`)
    tracker.enterPhase('building')

    try {
      await runGenerator(spec, handoff, round, config, tracker)
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        console.warn('[harness] Budget exceeded during build')
        break
      }
      console.error(`[harness] Generator failed: ${error}`)
      // Checkpoint recovery would happen here
      break
    }

    // Evaluator (clean-room)
    console.log(`[harness] Evaluating...`)
    tracker.enterPhase('evaluation')

    let evaluation: Evaluation
    try {
      evaluation = await runEvaluator(spec, contract, round, config, tracker)
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        console.warn('[harness] Budget exceeded during evaluation')
        break
      }
      console.warn(`[harness] Evaluator failed, treating as PARTIAL`)
      // Fallback: continue to next round without structured feedback
      continue
    }

    evaluations.push(evaluation)
    console.log(`[harness] Verdict: ${evaluation.verdict}`)
    console.log(`[harness] Scores: ${JSON.stringify(evaluation.scores)}`)

    if (evaluation.verdict === 'PASS') {
      console.log('[harness] PASS — stopping loop')
      break
    }

    // Plateau detection
    if (isPlateauing(evaluations, config.evaluation.plateau)) {
      console.log('[harness] Score plateau detected, stopping loop')
      break
    }

    // Budget check for next round
    if (tracker.wouldExceedBudget('building')) {
      console.log('[harness] Budget insufficient for another round')
      break
    }

    // Create handoff for next round
    handoff = createHandoff(evaluation, round, tracker)
    console.log(`[harness] Handoff: ${handoff.strategic_direction} — ${handoff.must_fix.length} items to fix`)
  }

  // Phase 4: Report
  const report = tracker.generateReport()
  writeReport(report, config.outputDir)
  console.log(`\n[harness] Done. ${evaluations.length} rounds. $${report.totalUsd.toFixed(2)} spent.`)

  return { spec, evaluations, report }
}

async function runPlannerWithRetry(
  config: HarnessConfig,
  tracker: CostTracker,
  maxRetries: number = 1
): Promise<ProductSpec> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await runPlanner(config.prompt, config, tracker)
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        console.warn(`[harness] Planner attempt ${attempt + 1} failed, retrying...`)
      }
    }
  }

  throw lastError
}

export function isPlateauing(
  history: Evaluation[],
  threshold: number = 0.5
): boolean {
  if (history.length < 2) return false

  const last = history[history.length - 1]
  const prev = history[history.length - 2]

  const avgLast = average(Object.values(last.scores))
  const avgPrev = average(Object.values(prev.scores))

  return (avgLast - avgPrev) < threshold
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function generateContract(spec: ProductSpec): AcceptanceContract {
  const criteria = spec.features.flatMap((feature, fi) =>
    feature.acceptance_criteria.map((criterion, ci) => ({
      id: `F${fi + 1}-C${ci + 1}`,
      description: criterion,
      testable: true,
      category: 'functionality' as const,
    }))
  )

  return {
    generated_from_spec: hashSpec(spec),
    criteria,
    generated_at: new Date().toISOString(),
  }
}

function hashSpec(spec: ProductSpec): string {
  const content = JSON.stringify(spec)
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

function createHandoff(
  evaluation: Evaluation,
  round: number,
  tracker: CostTracker
): Handoff {
  const handoff: Handoff = {
    round,
    verdict: evaluation.verdict,
    scores: evaluation.scores,
    thresholds_met: evaluation.threshold_failures.length === 0,
    must_fix: evaluation.findings
      .filter((f) => f.severity === 'critical' || f.severity === 'high')
      .map((f) => ({
        id: f.id,
        description: f.description,
        severity: f.severity,
      })),
    preserve: [], // Populated from previous round's passing items
    strategic_direction: evaluation.strategic_direction,
    direction_rationale: evaluation.direction_rationale,
    cost_so_far: {
      total_usd: tracker.getTotalUsd(),
      rounds_remaining: tracker.getRoundsRemaining(round),
      budget_remaining_usd: tracker.getRemainingBudget(),
    },
  }

  // Validate handoff schema
  handoffSchema.parse(handoff)
  return handoff
}

function writeReport(report: CostReport, outputDir: string): void {
  const reportPath = resolve(outputDir, 'cost-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[harness] Cost report: ${reportPath}`)
}
