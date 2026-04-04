import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { ProductSpec } from '../schemas/spec.schema'
import type { Handoff } from '../schemas/handoff.schema'
import type { HarnessConfig } from '../types/harness.types'
import { AgentExecutionError } from '../types/harness.types'
import type { CostTracker } from '../cost-tracker'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadPrompt(filename: string): string {
  const promptPath = resolve(__dirname, '..', 'prompts', filename)
  return readFileSync(promptPath, 'utf-8')
}

function buildUserPrompt(
  spec: ProductSpec,
  handoff: Handoff | undefined,
  round: number
): string {
  const specJson = JSON.stringify(spec, null, 2)

  if (!handoff) {
    return [
      '## Product Spec\n',
      specJson,
      '\n\nBuild the complete application according to this spec.',
      'This is Round 1. Start from scratch.',
    ].join('\n')
  }

  const directionLabel = handoff.strategic_direction === 'REFINE'
    ? 'REFINE the current implementation'
    : 'PIVOT to an entirely different aesthetic approach'

  return [
    `## Round ${round} — ${directionLabel}\n`,
    '### Product Spec\n',
    specJson,
    '\n### Previous Evaluation Feedback\n',
    `Verdict: ${handoff.verdict}`,
    `Direction: ${handoff.strategic_direction}`,
    `Rationale: ${handoff.direction_rationale}`,
    '\n### Must Fix (do NOT skip these)\n',
    ...handoff.must_fix.map((f) => `- [${f.severity}] ${f.description}`),
    '\n### Preserve (do NOT regress these)\n',
    ...handoff.preserve.map((p) => `- ${p.description}`),
    `\n### Budget Status\n`,
    `Spent: $${handoff.cost_so_far.total_usd.toFixed(2)}`,
    `Remaining: $${handoff.cost_so_far.budget_remaining_usd.toFixed(2)}`,
    `Rounds left: ${handoff.cost_so_far.rounds_remaining}`,
  ].join('\n')
}

export async function runGenerator(
  spec: ProductSpec,
  handoff: Handoff | undefined,
  round: number,
  config: HarnessConfig,
  tracker: CostTracker
): Promise<void> {
  const systemPrompt = loadPrompt('generator-system.md')
  const userPrompt = buildUserPrompt(spec, handoff, round)
  const startTime = Date.now()

  try {
    await callGeneratorAgent(systemPrompt, userPrompt, config)

    const durationMs = Date.now() - startTime
    tracker.recordUsage(round, 'generator', 0, 0, durationMs)
  } catch (error) {
    throw new AgentExecutionError('generator', 'building', error)
  }
}

async function callGeneratorAgent(
  systemPrompt: string,
  userPrompt: string,
  config: HarnessConfig
): Promise<void> {
  for await (const message of query({
    prompt: userPrompt,
    options: {
      systemPrompt,
      model: config.model,
      allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      permissionMode: 'acceptEdits',
      maxTurns: 100,
      cwd: config.outputDir,
    },
  })) {
    if ('error' in message) {
      throw new AgentExecutionError(
        'generator',
        'building',
        new Error(String(message.error))
      )
    }
  }
}
