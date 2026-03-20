# Harness Technical Strategy

## Why the earlier PRD was not enough

The first Campsite draft was strong on context structure and weak on runtime discipline. In harness-engineering terms, it described a static contract but not a full operational envelope.

That meant four gaps:

- observability was thin
- verification was shallow
- recovery paths were mostly implied
- operator intervention was not yet formalized

## Design Position

Campsite is not trying to be a heavy orchestration runtime. It is a lightweight checkpoint harness layer that makes file-based context observable, verifiable, and recoverable across devices.

Its design center is:

- detect early
- fail visibly
- recover cheaply
- keep overhead low

## Harness Layers

### 1. Static contract

Persistent files define project identity, state, handoff, and decisions.

Artifacts:

- `WORKSPACE.md`
- `README.md`
- `status.md`
- `handoff.md`
- `decisions.md`

### 2. Operational fieldkit

Small shell tools turn the contract into an operating system for sessions.

Current tools:

- `bootstrap.sh`
- `validate.sh`
- `context`
- `status-summary.sh`
- `workspace-open.sh`
- `campsite claude|codex|gemini|openclaw` wrappers

### 3. Checkpoint surface

This is the main product-facing layer.

- `campsite enter`
- `campsite resume`
- `campsite handoff`
- `campsite leave`

Planned tools:

- freshness check
- advisory lock helper
- session-start hook
- session-end hook

### 3. Verification layer

The product must convert ambiguous state into explicit failures before autonomous work proceeds.

Verification targets:

- required files exist
- key headers and sections exist
- one next action exists
- status and handoff are fresh enough
- the project is not already locked by another active actor

### 4. Recovery layer

Recovery is not magic. It is a bounded set of fallback paths.

Recovery paths:

- stale file detected
  stop autonomous work and request re-validation
- lock conflict detected
  read-only mode or explicit operator override
- incomplete handoff
  fall back to `README.md` plus unresolved questions
- deployment ambiguity
  block promotion until `deploy/` boundary is explicit

## Wrapper Strategy

The checkpoint commands are the primary product-facing part of Campsite.

Plain `claude` starts the agent directly.

`campsite claude <project>` reuses the same checkpoint logic and does five extra things:

- validates the project contract
- checks and writes the session lock
- compiles a session context artifact
- prints the required read order
- enters the project root with stable environment variables
- releases the lock when the agent exits

This is where handoff friction becomes visible and manageable to users.

## Explicit Limits

The current implementation is intentionally honest about what it does not solve yet.

- It does not guarantee tool-specific context injection for every agent CLI.
- It does not provide cross-device distributed locking.
- It does not infer semantic freshness from Git history or test evidence.
- It does not replace orchestration systems such as cmux or multi-agent supervisors.

## Low-Overhead Constraints

To stay viable on old laptops and 4GB-class VMs, Campsite must remain non-resident.

- one shell wrapper process is acceptable
- a background orchestration service is not
- lock files are acceptable
- state databases are not
- direct delegation to the agent CLI is acceptable
- output proxying and terminal rendering are out of scope

## Failure Taxonomy

Primary failure classes for Campsite:

- stale-state failure
- silent logical drift in next-action selection
- concurrency collision
- operator memory dependence
- deploy-boundary drift

The product goal is not zero failures. It is lower-cost failures.

## Metrics That Matter

The product should be judged on operational metrics, not aesthetic structure.

- context recovery time
- human escalation rate
- MTTR for stale or invalid project state
- validation catch rate
- protocol overhead versus recovery savings

## Product Discipline

Following the fieldkit logic from the book, Campsite should add tools only when their recovery value exceeds their operating cost. If a new script increases process friction but does not lower escalation or recovery time, it should not ship.
