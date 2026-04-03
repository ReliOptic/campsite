# Campsite Implementation Tracker

> Status: In Progress
> Last updated: 2026-04-03
> Goal: execute the recommended PRD-aligned implementation in handoff-safe slices

## Working Rules

- Every step ends with a visible artifact or code path.
- Every completed step is marked here before moving on.
- `status.md` and `handoff.md` should remain aligned with this tracker.

## Slice Plan

### Step 1. Progress and Handoff Safety

Status: `completed`

Completed work:

- added product-direction docs for recovery-first camp mode
- added family look and foundation boundary docs
- added this implementation tracker so work can hand off cleanly

Artifacts:

- `docs/spec-driven-prd-vibe-camp.md`
- `docs/family-look-spec.md`
- `docs/libghostty-foundation-boundary.md`
- `docs/implementation-tracker.md`

### Step 2. Camp State and Session Lifecycle

Status: `completed`

Completed work:

- added local camp state store
- added mission, participants, and event schema
- wired `sync`, session start, `save`, and `peek` into camp lifecycle
- added recovery-first camp render prototype

Artifacts:

- `lib/camp.sh`
- `docs/camp-state-schema.md`
- `tests/integration/test_camp.bats`

### Step 3. Freshness and Focus Mode Semantics

Status: `completed`

Target:

- make freshness a first-class concept instead of a loose warning
- align terminal output with mission / working-now / waiting-on-you / next-move language

Completed outputs:

- freshness helpers in shell libs
- richer status / validate / peek output
- updated docs and tests

### Step 4. Checkpoint Push

Status: `completed`

Target:

- make `campsite save` optionally create and push a safe checkpoint commit

Completed outputs:

- `campsite save --push`
- conservative git behavior
- auto-generated checkpoint commit message
- docs and tests

### Step 5. Live Camp Polish

Status: `in_progress`

Target:

- make current render and focus surfaces feel more like one world
- tighten the bridge between Camp mode and Focus mode

Planned outputs:

- stronger terminal copy
- better render summaries
- tighter family-look consistency

Completed in this slice so far:

- defined a hybrid test strategy that combines Ralph-style reliability loops with Campsite review gates
- added `scripts/hybrid-smoke.sh` as a high-value end-to-end smoke harness
- added `make test-hybrid` so the automated loop and manual review gate are run together
- added an execution blueprint that aligns implementation order, UX/UI hierarchy, and emotional direction
- removed over-talkative seeded camp participants in favor of a truthful quiet-camp empty state
- fixed manual participant enter/update flows so terminal metadata no longer shifts columns

### Step 5b. Session Summary Quality and Terminal Vocabulary Alignment

Status: `completed`

Completed work:

- session start/finish summaries now include tool name, terminal, and mission context
- peek labels changed from camp-now/camp-wait/camp-next to working-now/waiting-on-you/next-move (family-look vocabulary)
- status output restructured: mission → camp lines (alive/needs/next) → operational metadata
- duplicate mission/next-move removed from status
- sync output now shows brief mission context after compile
- save output now shows next-move after completion
- all tests updated to match new label format
- hybrid smoke passes

### Step 6. MVP Bug Fixes and Polish

Status: `completed`

Completed work:

- fixed `validate` command: `[[ ! ... =~ ... ]]` under `set -e` killed script when phase was valid — replaced with for-loop match; also fixed `&& warn` at end of `_validate_project` returning non-zero
- fixed `install.sh`: removed false bash 4+ requirement (no `declare -A` in codebase, actual minimum is bash 3.2)
- fixed `campsite go`: history now bootstrapped on `sync` so `go` works from first session; fixed `tac` not available on macOS by adding `tail -r` and awk fallback
- added Google Fonts CDN (Inter + Space Grotesk) to camp render HTML
- added failure message to `camp_open_browser` when neither `open` nor `xdg-open` available
- improved zero-adapter message in `sync` with specific install guidance
- added `make test-hybrid` step to CI workflow

## Current Next Move

- interactive launcher와 setup 흐름 점검 (TTY 환경 필요)
- freshness를 launcher confidence에 반영하는 단계 검토
- camp render HTML return panel과 terminal output label 일관성 최종 점검
