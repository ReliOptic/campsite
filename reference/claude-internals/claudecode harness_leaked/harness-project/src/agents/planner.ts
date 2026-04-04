import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { productSpecSchema } from '../schemas/spec.schema'
import type { ProductSpec } from '../schemas/spec.schema'
import type { HarnessConfig } from '../types/harness.types'
import { SchemaValidationError, AgentExecutionError } from '../types/harness.types'
import type { CostTracker } from '../cost-tracker'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadPrompt(filename: string): string {
  const promptPath = resolve(__dirname, '..', 'prompts', filename)
  return readFileSync(promptPath, 'utf-8')
}

function buildSystemPrompt(config: HarnessConfig): string {
  const base = loadPrompt('planner-system.md')
  const designSkill = loadPrompt('design-skill.md')

  const parts = [base, '\n\n## Design Skill Reference\n\n', designSkill]

  if (config.features.aiWeaving) {
    const weaving = loadPrompt('ai-weaving.md')
    parts.push('\n\n## AI Integration Directive\n\n', weaving)
  }

  return parts.join('')
}

export async function runPlanner(
  prompt: string,
  config: HarnessConfig,
  tracker: CostTracker
): Promise<ProductSpec> {
  const systemPrompt = buildSystemPrompt(config)
  const startTime = Date.now()

  try {
    // Agent SDK call placeholder
    // In production: const result = await agent({ system: systemPrompt, prompt, tools: [...] })
    const rawOutput = await callPlannerAgent(systemPrompt, prompt, config)

    const parsed = productSpecSchema.safeParse(rawOutput)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      )
      throw new SchemaValidationError('planner', errors)
    }

    const durationMs = Date.now() - startTime
    // Token counts would come from the Agent SDK response
    tracker.recordUsage(0, 'planner', 0, 0, durationMs)

    return parsed.data
  } catch (error) {
    if (error instanceof SchemaValidationError) throw error
    throw new AgentExecutionError('planner', 'planning', error)
  }
}

async function callPlannerAgent(
  systemPrompt: string,
  prompt: string,
  config: HarnessConfig
): Promise<unknown> {
  const specSchemaJson = JSON.stringify(productSpecSchema.shape, null, 2)
  const fullPrompt = [
    `Create a full product spec for: ${prompt}`,
    '',
    'Output ONLY valid JSON matching this schema:',
    specSchemaJson,
  ].join('\n')

  let resultText = ''

  for await (const message of query({
    prompt: fullPrompt,
    options: {
      systemPrompt,
      model: config.model,
      allowedTools: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'],
      permissionMode: 'acceptEdits',
      maxTurns: 30,
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
