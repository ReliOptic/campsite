# Campsite PRD v2

> Owner: Kiwon Cho
> Status: Draft v2
> Last updated: 2026-03-20

## 1. Product Summary

Campsite is a terminal-first, cross-device session checkpoint product for AI coding agents and human engineers. Its job is to preserve project intent, current state, and next action across Mac, PC, and cloud sessions without relying on chat history or a proprietary runtime.

Campsite is not a full agent runtime. It is the persistent checkpoint contract and lightweight fieldkit around the runtime.

## 2. Problem Statement

AI coding tools generate code quickly but lose operational context between sessions. When the session moves to another device or another tool, the next actor must reconstruct state from raw files and chat residue. That creates four expensive failure modes:

- context loss at session start
- silent logical drift caused by stale or missing state
- repeated human escalation for routine handoff questions
- deployment rework because repository boundaries were never made explicit

The product problem is not only missing memory. It is missing operational envelope.

## 3. Product Thesis

The workspace itself must become a durable, machine-readable checkpoint protocol for project state. But file structure alone is insufficient. A usable Campsite system must combine:

- static contract for durable context
- operational fieldkit for detection and validation
- recovery hooks for stale or conflicting state
- operator-facing checkpoint surface for fast intervention
- low enough overhead that the harness does not become the bottleneck

## 4. Harness Engineering Position

Campsite is explicitly a harness-engineering product, not just a documentation template.

In harness terms, Campsite exists to turn:

- undetectable context loss into detectable state drift
- unrecoverable handoff failures into recoverable session restarts
- hidden ambiguity into explicit next-action contracts
- ad hoc operator intervention into repeatable operating protocol

Campsite therefore sits at the intersection of the book's five variables:

- product surface: terminal-first CLI
- harness: workspace contract, validation, freshness checks, lock discipline
- operator intervention: explicit read order, escalation points, handoff files
- compute: minimal shell-first tooling, no daemon, no resident service
- model: tool-agnostic agent support through plain-text contracts

## 5. Goals

- G1: recover actionable project context in under 60 seconds
- G2: support near-zero-verbal handoff between devices
- G3: remain usable from plain terminal sessions
- G4: keep project layouts deployment-friendly from day zero
- G5: make the next action inferable from files alone
- G6: convert stale or conflicting workspace state into explicit validation failures instead of silent drift
- G7: keep harness overhead low enough that adoption remains easier than bypassing the system

## 6. Non-Goals

- full IDE replacement
- GUI-first workflow manager
- proprietary sync or hosted backend
- live multi-agent scheduler
- model-specific orchestration logic

## 7. Primary Users

- AI coding agents that need durable, machine-readable session context
- engineers switching between Mac, PC, and remote environments
- PM or technical leads reading concise state summaries

## 8. Jobs To Be Done

When I reopen a project on another device, I want to resume from a checkpoint and know what the project is, what state it is in, and what to do next without asking another person.

When an AI coding tool starts a session, I want it to read a fixed sequence of files so it can act with minimal prompting and minimal drift.

When the workspace state is stale or contradictory, I want the system to fail visibly before the agent continues.

When I decide to deploy a project, I want the repository layout to already separate source, scripts, and deployment assets.

## 9. Technical Strategy

### 9.1 Document Roles

- `README.md`: quickstart and operator-facing command surface
- `Campsite-prd-v2.md`: canonical product contract
- `docs/harness-technical-strategy.md`: implementation strategy, tradeoffs, and explicit limitations

### 9.2 Operating Model

Campsite follows a layered model:

1. Static contract layer
   Durable files that survive reboot, device switch, and tool change.
2. Operational fieldkit
   Small CLI helpers that scaffold, validate, summarize, and gate project state.
3. Checkpoint layer
   Commands that mark project entry, resume, handoff, and exit.
4. Verification layer
   Checks that convert ambiguity into explicit failure before work continues.
5. Recovery layer
   Procedures for stale state, lock conflicts, and incomplete handoff.
6. Operator surface
   Fast terminal checkpoint entrypoint for humans and agents to re-enter the workspace.

### 9.3 Operational Envelope

The Campsite harness defines the allowed operating envelope for a session:

- read order is fixed
- required project files are fixed
- next action must be explicit
- non-trivial decisions must be logged
- deployment boundary must be visible in the repository
- stale or malformed state must block autonomous progression

### 9.4 Failure Budget Reallocation

Campsite does not claim to remove failure. It reallocates failure from high-cost forms to lower-cost forms.

Target shift:

- from silent drift to visible validation failure
- from human memory dependency to file-based recovery
- from repeated verbal escalation to structured handoff
- from ambiguous repository layout to explicit deploy boundary

### 9.5 Fieldkit Principle

Campsite must be built incrementally. Each tool in the fieldkit must earn its place by reducing recovery time or escalation rate more than it increases process overhead.

Initial fieldkit components:

- project bootstrap
- project validation
- status summary
- workspace open guide
- agent wrapper commands for `claude`, `codex`, `gemini`, and `openclaw`

Deferred fieldkit components:

- freshness validator
- advisory lock manager
- session-start and session-end hooks
- git hook enforcement

### 9.6 Current Technical Limits

- current locking is local to the working tree and does not propagate across devices through Git
- current freshness detection is file-age based and not yet repo-aware
- current agent wrappers compile and expose session context, but tool-specific prompt injection is not yet guaranteed across all CLIs

## 10. Core Spec

### 10.1 Session Protocol

Required read order for any session:

1. `/root/workspace/WORKSPACE.md`
2. `<project>/README.md`
3. `<project>/status.md`
4. `<project>/handoff.md`

Required write-back before session end:

1. update `status.md`
2. update `handoff.md`
3. append to `decisions.md` if a non-trivial decision was made

### 10.2 Project Shape

Each Campsite project must contain:

- `README.md`
- `status.md`
- `handoff.md`
- `decisions.md`
- `scripts/bootstrap.sh`
- `src/`
- `tests/`
- `deploy/`

### 10.3 Status Contract

`status.md` must include:

- phase
- confidence
- last-updated
- last-agent
- last-device
- active branch
- what works
- what does not work
- blockers

### 10.4 Handoff Contract

`handoff.md` must include:

- one explicit next task
- optional fallback task
- priority
- estimated scope
- entry point
- precondition
- open questions
- short session log

### 10.5 Verification Contract

The fieldkit must be able to detect:

- missing required files
- malformed file headers
- missing next action
- missing status phase
- stale handoff or status data
- lock conflict for the same project

Freshness for the MVP is based on `status.md` and `handoff.md` file modification time, with a default stale threshold of 48 hours.

### 10.6 CLI Surface

MVP commands:

- `bin/campsite init <abs-project-path>`
- `bin/campsite validate <abs-project-path>`
- `bin/campsite context <abs-project-path>`
- `bin/campsite enter <abs-project-path> [actor]`
- `bin/campsite resume <abs-project-path>`
- `bin/campsite handoff <abs-project-path>`
- `bin/campsite leave <abs-project-path>`
- `bin/campsite summary [projects-root]`
- `bin/campsite claude <abs-project-path> [tool-args...]`
- `bin/campsite codex <abs-project-path> [tool-args...]`
- `bin/campsite gemini <abs-project-path> [tool-args...]`
- `bin/campsite openclaw <abs-project-path> [tool-args...]`

## 11. Functional Requirements

- FR1: A new project can be scaffolded in one command.
- FR2: A project can be validated in one command.
- FR3: Campsite must fail visibly when required session context is missing.
- FR4: Campsite must not require a daemon, database, or network service.
- FR5: Campsite artifacts must remain human-readable plain text.
- FR6: Campsite scripts must be POSIX shell compatible.
- FR7: The workflow must remain useful without depending on any specific terminal emulator.
- FR8: Campsite must expose a single CLI entrypoint for humans and agents.
- FR9: Campsite must be able to launch supported agent CLIs inside the session checkpoint protocol.
- FR10: Campsite must compile a single session context artifact from workspace and project state.

## 12. Non-Functional Requirements

- NFR1: workspace boot path must feel instantaneous
- NFR2: files must remain git-friendly and mergeable
- NFR3: conventions must stay portable across Mac, Linux, and Windows-backed filesystems
- NFR4: the contract must be simple enough for AI tools to infer without custom parsing logic
- NFR5: the harness must stay lightweight enough to avoid becoming the primary bottleneck
- NFR6: Campsite must remain viable on low-memory environments such as old 8GB laptops and 4GB-class Linux VMs

## 12.1 4GB-Safe Architecture Constraints

To preserve low-memory viability, Campsite must not:

- run a resident daemon
- hold workspace state in memory after command exit
- introduce a local database or event bus
- embed a terminal emulator or browser
- proxy or stream agent output through a long-running supervisor unless strictly necessary

Instead, Campsite should:

- execute as a short-lived POSIX shell dispatcher
- persist state in plain text files and lock files
- delegate the heavy process directly to the chosen agent CLI
- keep wrapper work limited to validation, environment setup, lock handling, and process launch

## 13. Failure Taxonomy

Campsite is designed around these recurrent failure classes:

- stale-state failure
  `status.md` or `handoff.md` exists but no longer reflects the repo
- silent-next-action drift
  the project is active but the next action is ambiguous
- concurrency collision
  two agents or users operate on the same project without coordination
- deployment-boundary drift
  code and deploy assets mix in ways that prevent easy promotion
- operator memory dependence
  the project only makes sense if another person explains it verbally

## 14. Metrics

Primary metrics:

- context recovery time
- human escalation rate
- mean time to recovery for stale or malformed project state
- next-action inference rate
- stale-context detection rate

### 14.1 Measurement Plan

- context recovery time
  measured as wall-clock time from `campsite enter` to the operator or agent reaching a valid next action
- human escalation rate
  counted as sessions where the next action could not be inferred from `status.md` and `handoff.md`
- next-action inference rate
  measured in structured replay trials using generated Campsite projects and real project snapshots
- stale-context detection rate
  measured as the percentage of intentionally aged `status.md` and `handoff.md` files rejected by `campsite validate`
- wrapper benefit
  compared by replaying `plain tool launch` versus `campsite tool launch` and measuring whether the correct project root, context artifact, and lock behavior were established

Harness-specific metrics:

- overhead-to-recovery ratio
  time spent updating Campsite files versus time saved in recovery
- validation catch rate
  percentage of stale or malformed states caught before work proceeds

## 15. Risks And Mitigations

- stale status files
  mitigation: validation and explicit session-end protocol
- over-designed process
  mitigation: fieldkit components only ship if they reduce MTTR or escalation cost
- tool lock-in
  mitigation: avoid terminal-specific dependencies and preserve plain shell entrypoints
- naming inconsistency across operating systems
  mitigation: recommend lowercase slugs even when display names are title case
- harness overhead grows faster than value
  mitigation: add components incrementally and measure recovery benefit

## 16. Roadmap

### Phase 1

- stabilize markdown templates
- use bootstrap to create one real project
- validate the end-to-end handoff loop

### Phase 2

- add freshness and completeness checks
- add advisory lock format
- add git hook examples for session-end discipline

### Phase 3

- add failure-detection reporting
- add operator-facing escalation rules
- test Mac to PC handoff with at least one live project

### Phase 4

- add reference deploy assets for cloud promotion
- document measured recovery and escalation improvements

## 17. Acceptance Criteria

- A user can scaffold a new Campsite-style project with one command.
- A second user or AI agent can recover the next task by reading the generated files only.
- Validation fails when required files or mandatory headers are missing.
- The repository remains fully usable from a plain terminal.
- Campsite converts at least one ambiguous handoff condition into an explicit validation failure.
