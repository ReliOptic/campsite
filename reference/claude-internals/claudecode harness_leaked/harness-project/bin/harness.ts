#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { runHarness } from '../src/orchestrator'
import type { HarnessConfig, EvaluationThresholds, FeatureFlags } from '../src/types/harness.types'

const DEFAULT_EVALUATION: EvaluationThresholds = {
  designQuality: 7,
  originality: 6,
  craft: 6,
  functionality: 8,
  plateau: 0.5,
}

const DEFAULT_FEATURES: FeatureFlags = {
  planner: true,
  designEvaluation: true,
  aiWeaving: true,
  contractGeneration: true,
}

interface CliArgs {
  prompt?: string
  preset?: string
  budgetUsd?: number
  maxRounds?: number
  outputDir?: string
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--preset' && args[i + 1]) {
      result.preset = args[++i]
    } else if (arg === '--budget' && args[i + 1]) {
      result.budgetUsd = parseFloat(args[++i])
    } else if (arg === '--max-rounds' && args[i + 1]) {
      result.maxRounds = parseInt(args[++i], 10)
    } else if (arg === '--output' && args[i + 1]) {
      result.outputDir = args[++i]
    } else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    } else if (!arg.startsWith('--') && !result.prompt) {
      result.prompt = arg
    }
  }

  return result
}

interface FileConfig {
  preset?: string
  budgetUsd?: number
  maxRounds?: number
  evaluation?: EvaluationThresholds
}

function loadConfigFile(): FileConfig {
  const configPath = resolve(process.cwd(), '.harness.yaml')
  if (!existsSync(configPath)) return {}

  const raw = readFileSync(configPath, 'utf-8')
  const parsed = parseYaml(raw) as Record<string, unknown>

  const config: FileConfig = {}
  if (parsed.preset) config.preset = parsed.preset as string
  if (parsed.budget_usd) config.budgetUsd = parsed.budget_usd as number
  if (parsed.max_rounds) config.maxRounds = parsed.max_rounds as number

  if (parsed.evaluation && typeof parsed.evaluation === 'object') {
    const eval_ = parsed.evaluation as Record<string, number>
    config.evaluation = {
      designQuality: eval_.design_quality_threshold ?? DEFAULT_EVALUATION.designQuality,
      originality: eval_.originality_threshold ?? DEFAULT_EVALUATION.originality,
      craft: eval_.craft_threshold ?? DEFAULT_EVALUATION.craft,
      functionality: eval_.functionality_threshold ?? DEFAULT_EVALUATION.functionality,
      plateau: eval_.plateau_threshold ?? DEFAULT_EVALUATION.plateau,
    }
  }

  return config
}

function printUsage(): void {
  console.log(`
harness-eng — 3-agent harness for application development

Usage:
  harness-eng "Build a project management app" [options]

Options:
  --preset <name>       Stack preset (default: full-stack-web)
  --budget <usd>        Budget cap in USD (default: 150)
  --max-rounds <n>      Maximum build-QA rounds (default: 3)
  --output <dir>        Output directory (default: ./artifacts)
  --help, -h            Show this help

Environment:
  ANTHROPIC_API_KEY     Required. Your Anthropic API key.
  HARNESS_BUDGET_USD    Override budget (same as --budget)
  HARNESS_MAX_ROUNDS    Override max rounds (same as --max-rounds)

Config file:
  Place .harness.yaml in your project root. See .harness.yaml.example.
`)
}

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv.slice(2))
  const fileConfig = loadConfigFile()

  if (!cliArgs.prompt) {
    console.error('Error: Please provide a prompt. Example:')
    console.error('  harness-eng "Build a DAW application"')
    process.exit(1)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required.')
    process.exit(1)
  }

  const envBudget = parseFloat(process.env.HARNESS_BUDGET_USD ?? '')
  const envRounds = parseInt(process.env.HARNESS_MAX_ROUNDS ?? '', 10)

  const config: HarnessConfig = {
    prompt: cliArgs.prompt,
    preset: cliArgs.preset ?? fileConfig.preset ?? 'full-stack-web',
    model: process.env.HARNESS_MODEL ?? 'claude-opus-4-6',
    budgetUsd: envBudget || cliArgs.budgetUsd || fileConfig.budgetUsd || 150,
    maxRounds: envRounds || cliArgs.maxRounds || fileConfig.maxRounds || 3,
    outputDir: cliArgs.outputDir ?? './artifacts',
    evaluation: fileConfig.evaluation ?? DEFAULT_EVALUATION,
    features: DEFAULT_FEATURES,
  }

  console.log(`[harness-eng] Starting with budget $${config.budgetUsd}, max ${config.maxRounds} rounds`)
  console.log(`[harness-eng] Prompt: "${config.prompt}"`)
  console.log(`[harness-eng] Preset: ${config.preset}\n`)

  try {
    const result = await runHarness(config)
    console.log(`\n[harness-eng] Complete.`)
    console.log(`  Features: ${result.spec.features.length}`)
    console.log(`  Rounds: ${result.evaluations.length}`)
    console.log(`  Final verdict: ${result.evaluations.at(-1)?.verdict ?? 'N/A'}`)
    console.log(`  Total cost: $${result.report.totalUsd.toFixed(2)}`)
  } catch (error) {
    console.error(`\n[harness-eng] Failed: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

main()
