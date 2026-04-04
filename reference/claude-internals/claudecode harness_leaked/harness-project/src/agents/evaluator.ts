import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { evaluationSchema } from '../schemas/evaluation.schema'
import type { Evaluation } from '../schemas/evaluation.schema'
import type { ProductSpec } from '../schemas/spec.schema'
import type { AcceptanceContract } from '../schemas/contract.schema'
import type { HarnessConfig, EvaluationThresholds } from '../types/harness.types'
import { SchemaValidationError, AgentExecutionError } from '../types/harness.types'
import type { CostTracker } from '../cost-tracker'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadPrompt(filename: string): string {
  const promptPath = resolve(__dirname, '..', 'prompts', filename)
  return readFileSync(promptPath, 'utf-8')
}

/**
 * Clean-room evaluator: receives ONLY spec + contract + evaluation criteria.
 * No Generator context, no Generator system prompt, no debugging logs.
 */
function buildCleanRoomPrompt(
  spec: ProductSpec,
  contract: AcceptanceContract,
  thresholds: EvaluationThresholds
): string {
  return [
    '## Product Spec\n',
    JSON.stringify(spec, null, 2),
    '\n\n## Acceptance Contract\n',
    JSON.stringify(contract, null, 2),
    '\n\n## Score Thresholds\n',
    `- design_quality: minimum ${thresholds.designQuality}`,
    `- originality: minimum ${thresholds.originality}`,
    `- craft: minimum ${thresholds.craft}`,
    `- functionality: minimum ${thresholds.functionality}`,
    '\nAny criterion below its threshold means FAIL.',
  ].join('\n')
}

export async function runEvaluator(
  spec: ProductSpec,
  contract: AcceptanceContract,
  round: number,
  config: HarnessConfig,
  tracker: CostTracker
): Promise<Evaluation> {
  const systemPrompt = loadPrompt('evaluator-system.md')
  const userPrompt = buildCleanRoomPrompt(spec, contract, config.evaluation)
  const startTime = Date.now()

  try {
    const rawOutput = await callEvaluatorAgent(systemPrompt, userPrompt, config)

    const parsed = evaluationSchema.safeParse(rawOutput)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      )
      throw new SchemaValidationError('evaluator', errors)
    }

    const durationMs = Date.now() - startTime
    tracker.recordUsage(round, 'evaluator', 0, 0, durationMs)

    return parsed.data
  } catch (error) {
    if (error instanceof SchemaValidationError) throw error
    throw new AgentExecutionError('evaluator', 'evaluation', error)
  }
}

async function callEvaluatorAgent(
  systemPrompt: string,
  userPrompt: string,
  config: HarnessConfig
): Promise<unknown> {
  const evalSchemaJson = JSON.stringify(evaluationSchema.shape, null, 2)
  const fullPrompt = [
    userPrompt,
    '',
    'Evaluate the built application. Output ONLY valid JSON matching this schema:',
    evalSchemaJson,
  ].join('\n')

  let resultText = ''

  for await (const message of query({
    prompt: fullPrompt,
    options: {
      systemPrompt,
      model: config.model,
      allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],
      permissionMode: 'default',
      maxTurns: 50,
      cwd: config.outputDir,
    },
  })) {
    if ('result' in message) {
      resultText = message.result
    }
  }

  const jsonMatch = resultText.match(/```json\s*([\s\S]*?)```/)
  const raw = jsonMatch ? jsonMatch[1].trim() : resultText.trim()
  return JSON.parse(raw)
}
