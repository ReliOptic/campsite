# Status - Campsite

## Current State

- phase: building
- confidence: medium
- last-updated: 2026-04-27
- last-agent: claude-opus
- last-device: Kiwonui-MacBookAir

## Active Branch

- branch: claude/improve-north-star-1klPC
- base: main

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
- Sparse camps now stay quiet instead of inventing fake participants, and the rendered scene shows an explicit truthful empty state.
- Manual `camp participant enter/update` now preserve terminal metadata correctly.
- Design asset prompts and folder structure now exist for future visual production.
- Camp render now has CSS night sky (JS-generated stars, moon haze, twinkle animation).
- Camp render now has inline SVG sprite sheet (campfire + 5 fire-state icons on participant chips).
- Campfire glow effect on mission card with flicker animation.
- 4px cyan corner accents on mission card.
- Active participant (modakbul) has subtle pulse animation.
- `prefers-reduced-motion` disables all animations.
- Asset pipeline exists (`lib/camp-assets.sh`) — install, base64, manifest helpers.
- `camp serve` now copies `design/export/` assets to runtime camp dir.
- `camp_render` inlines campfire-core base64 from `design/export/` when available (<15KB).
- Serve JSON now includes full participant array for live polling.
- Live-poll script now refreshes participant list, not just return values.
- Implementation work is now tracked in `docs/implementation-tracker.md`.
- `validate` command works correctly on all bash versions (3.2+).
- `campsite go` works from first `sync` (history bootstrapped automatically).
- `history_mru_projects` works on macOS (no `tac` dependency).
- Camp render HTML includes Google Fonts CDN for Inter and Space Grotesk.
- `install.sh` no longer falsely requires bash 4+ (actual minimum: bash 3.2).
- CI now runs `make test-hybrid`.
- Freshness now drives the launcher: stale state blocks (with `--force` / `CAMPSITE_FRESHNESS_POLICY=warn|off` overrides), aging warns, and stated confidence is degraded by freshness in the launcher list, status output, and session banner.
- `campsite hud` always-alive multi-camp HUD: polling full-screen render (default), `--once`, `--line` (tmux status-line), `--json` (machine-readable). Each camp shows fire-state glyph, current activity (active agent + uptime, or idle age), effective confidence, and current mission.

## What Does Not Work Yet

- No generated pixel art assets yet — CSS/SVG fallback layer is complete but `design/export/` is empty.
- Serve-mode environmental scene (forest edges, ground tiles, props) not yet implemented.

## Blockers

- `bats` is not available in the current environment, so unit/integration tests run only in CI.
- Need a clear product decision on whether future checkpoint push should include new untracked files or stay tracked-only.
