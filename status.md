# Status - Campsite

## Current State

- phase: building
- confidence: high
- last-updated: 2026-04-29
- last-agent: claude-sonnet
- last-device: Kiwonui-MacBookAir

## Active Branch

- branch: master
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
- Freshness now drives launcher confidence and blocking semantics (`bin/campsite:107-118`, `1649-1663`).
- Serve-mode environmental scene (forest edges, ground tiles, props) is implemented (`lib/camp.sh:590-666`).
- 14 HIGH/MEDIUM UX issues fixed: sync completion message, fail() recovery hints, empty state messages, next-move double prefix, participant list/remove, Session Log truncation, templates cleanup.
- "1 participants" singular/plural bug fixed.
- make check passes: 172 unit + 38 integration tests (210 total) on local and CI.
- Phase 4: `campsite camp message` (send/reply/list/flag/resolve), role/stance on participants, unresolved thread escalation in overview and dashboard.
- HTML camp dashboard now shows Threads panel with amber highlight for unresolved, reply indentation, and resolve command hint.
- `campsite camp message` has 7 integration tests: send, reply, list, list --unresolved, resolve, flag, overview MSGS line. make check 172 unit + 45 integration = 217 total, all passing.
- External design brief (`design/design-brief.md`), Active Camp copy(KR/EN), and v1.0 completion roadmap(`docs/completion-roadmap.md`) committed.
- Claude Design handoff bundle landed at `design/handoff/2026-04-29-claude-design/` (13 files: HTML/CSS/JSX prototypes for F-1/F-2/F-3 + design system reference cards). Token HEX values match design brief §5.1 exactly. Standalone preview launcher (`start-preview.sh`) verified HTTP 200 for entry HTML + tokens.css + active-camp.jsx. Integration plan documented in `INTEGRATION.md` with 6-step migration path.
- UX evaluation by 4-specialist parallel team(analyst·critic·code-reviewer·designer) reported, embedded at design/handoff/2026-04-29-claude-design/UX_EVAL_2026-04-29.md. Verdict: handoff fails v1.0 gate (P0 5건). Embed work suspended until M3 round.

## What Does Not Work Yet

- No generated pixel art assets — `design/export/` is empty, Phaser storyworld is inactive.
- Participant `last_seen` displays raw ISO 8601 timestamps (relative time conversion not implemented).
- INTEGRATION.md self-validation results (especially §3.3 "9/10 compliance" claim) excluded from authoritative materials per UX_EVAL §3.3 (4 additional §8 violations identified).
- Handoff design system not yet adopted by camp_render() — embed deferred until P0 5 items resolved (persona-scenario fit, §6 70% missing assets, §8 4 violations, WCAG AA 6 violations, external CDN dependencies).

## Blockers

- Need a clear product decision on whether future checkpoint push should include new untracked files or stay tracked-only.
