# Status - Campsite

## Current State

- phase: discovery
- confidence: medium
- last-updated: 2026-03-20
- last-agent: codex
- last-device: /root

## Active Branch

- branch: main
- base: none

## What Works

- Product direction is defined around cross-device context continuity.
- A concrete repository skeleton now exists for the Campsite project itself.
- The PRD now frames Campsite as a harness product, not just a context template.
- A technical strategy document now maps Campsite to observability, verification, recovery, and operator intervention.
- A single `campsite` CLI now exists as the main entrypoint.
- Agent wrapper commands now launch `claude`, `codex`, `gemini`, and `openclaw` inside the Campsite session protocol.
- The product surface is now being reframed around checkpoint commands: `enter`, `resume`, `handoff`, `leave`.

## What Does Not Work Yet

- No freshness validator exists yet.
- Advisory locking exists, but stale-lock recovery is not implemented yet.
- No automated session-end evidence enforcement exists yet.

## Blockers

- Need first real workspace project to validate the handoff protocol.
- Need measured overhead targets so the fieldkit does not become bureaucratic.
- Need real-agent trials to confirm the wrapper benefit against Claude/Codex/Gemini CLIs.
- Need stale-lock and freshness behavior before the checkpoint story is fully credible.
