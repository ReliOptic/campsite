# Status - Campsite

## Current State

- phase: building
- confidence: medium
- last-updated: 2026-04-03
- last-agent: codex
- last-device: Kiwonui-MacBookAir

## Active Branch

- branch: main
- base: none

## What Works

- Product identity is now framed as a recovery-first AI workspace.
- README now introduces Campsite around 발상, 검토, 체력.
- Camp mode / Focus mode family look and product philosophy are documented.
- Local camp state now exists with mission, participants, events, and session snapshots.
- `sync`, active sessions, `save`, and `peek` now integrate with camp state.
- A local camp render prototype exists and reads real camp state.
- Terminal surface detection is stronger and now captures Ghostty/tmux-like environments more accurately.
- Freshness helpers now exist and are surfaced in terminal-facing status flows.
- `campsite save --push` now creates a conservative checkpoint commit and pushes it to the current branch.
- A hybrid testing strategy now exists, with a smoke harness covering `status`, `sync`, `camp overview`, `camp render`, and `save --push`.
- Design asset prompts and folder structure now exist for future visual production.
- Implementation work is now tracked in `docs/implementation-tracker.md`.

## What Does Not Work Yet

- Freshness is still mostly advisory and not yet used to drive stronger launcher confidence or blocking semantics.
- Focus mode terminal copy is improved but still not fully Campsite-native across every command path.
- The camp scene is still a structural prototype and not yet wired to live visual assets.

## Blockers

- `bats` is not available in the current environment, so new tests are being added but not executed automatically here.
- Need better live camp summaries so default seeded participants do not over-speak when real state is sparse.
- Need a clear product decision on whether future checkpoint push should include new untracked files or stay tracked-only.
